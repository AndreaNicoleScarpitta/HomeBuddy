import type { Home, System, MaintenanceTask, ChatMessage } from "@shared/schema";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || "Request failed");
  }
  return response.json();
}

// Home API
export async function getHome(): Promise<Home | null> {
  try {
    const response = await fetch("/api/home");
    if (response.status === 404) {
      return null;
    }
    return handleResponse<Home>(response);
  } catch (error) {
    if ((error as any)?.message === "Home not found") {
      return null;
    }
    throw error;
  }
}

export async function createHome(data: {
  address: string;
  builtYear?: number;
  sqFt?: number;
  type?: string;
}): Promise<Home> {
  const response = await fetch("/api/home", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Home>(response);
}

export async function updateHome(id: number, data: Partial<Home>): Promise<Home> {
  const response = await fetch(`/api/home/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Home>(response);
}

// Systems API
export async function getSystems(homeId: number): Promise<System[]> {
  const response = await fetch(`/api/home/${homeId}/systems`);
  return handleResponse<System[]>(response);
}

export async function createSystem(homeId: number, data: {
  name: string;
  age?: number;
  status?: string;
}): Promise<System> {
  const response = await fetch(`/api/home/${homeId}/systems`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<System>(response);
}

// Tasks API
export async function getTasks(homeId: number): Promise<MaintenanceTask[]> {
  const response = await fetch(`/api/home/${homeId}/tasks`);
  return handleResponse<MaintenanceTask[]>(response);
}

export async function createTask(homeId: number, data: Partial<MaintenanceTask>): Promise<MaintenanceTask> {
  const response = await fetch(`/api/home/${homeId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<MaintenanceTask>(response);
}

export async function updateTask(id: number, data: Partial<MaintenanceTask>): Promise<MaintenanceTask> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<MaintenanceTask>(response);
}

export async function deleteTask(id: number): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(response);
}

// Chat API
export async function getChatMessages(homeId: number): Promise<ChatMessage[]> {
  const response = await fetch(`/api/home/${homeId}/chat`);
  return handleResponse<ChatMessage[]>(response);
}

export async function createChatMessage(homeId: number, data: {
  role: string;
  content: string;
}): Promise<ChatMessage> {
  const response = await fetch(`/api/home/${homeId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ChatMessage>(response);
}
