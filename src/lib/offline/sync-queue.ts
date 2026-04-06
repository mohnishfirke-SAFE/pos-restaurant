interface QueuedMutation {
  id: string;
  endpoint: string;
  method: "POST" | "PATCH" | "DELETE";
  payload: unknown;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = "pos-offline-queue";

export function getQueue(): QueuedMutation[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addToQueue(mutation: Omit<QueuedMutation, "id" | "timestamp" | "retries">) {
  const queue = getQueue();
  queue.push({
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retries: 0,
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromQueue(id: string) {
  const queue = getQueue().filter((m) => m.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function processQueue() {
  const queue = getQueue();
  if (queue.length === 0) return;

  for (const mutation of queue) {
    try {
      const response = await fetch(mutation.endpoint, {
        method: mutation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mutation.payload),
      });

      if (response.ok) {
        removeFromQueue(mutation.id);
      } else if (mutation.retries >= 3) {
        removeFromQueue(mutation.id);
        console.error(`Failed to sync mutation ${mutation.id} after 3 retries`);
      } else {
        // Increment retry count
        const updated = getQueue().map((m) =>
          m.id === mutation.id ? { ...m, retries: m.retries + 1 } : m
        );
        localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
      }
    } catch {
      // Network error, will retry next time
      break;
    }
  }
}

// Listen for online event
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    processQueue();
  });
}
