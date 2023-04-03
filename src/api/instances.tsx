import { TIMEOUT_120, TIMEOUT_60, watchOperation } from "./operations";
import {
  handleEtagResponse,
  handleResponse,
  handleTextResponse,
} from "util/helpers";
import { LxdInstance } from "types/instance";
import { LxdTerminal, TerminalConnectPayload } from "types/terminal";
import { LxdApiResponse } from "types/apiResponse";
import { LxdOperation } from "types/operation";

export const fetchInstance = (
  name: string,
  project: string,
  recursion = 2
): Promise<LxdInstance> => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${name}?project=${project}&recursion=${recursion}`)
      .then(handleEtagResponse)
      .then((data) => resolve(data as LxdInstance))
      .catch(reject);
  });
};

export const fetchInstances = (project: string): Promise<LxdInstance[]> => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances?project=${project}&recursion=2`)
      .then(handleResponse)
      .then((data: LxdApiResponse<LxdInstance[]>) => resolve(data.metadata))
      .catch(reject);
  });
};

export const createInstance = (
  body: string,
  project: string
): Promise<LxdOperation> => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances?project=${project}`, {
      method: "POST",
      body: body,
    })
      .then(handleResponse)
      .then((data: LxdOperation) => {
        watchOperation(data.operation, TIMEOUT_120).then(resolve).catch(reject);
      })
      .catch(reject);
  });
};

export const updateInstance = (instance: LxdInstance, project: string) => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${instance.name}?project=${project}`, {
      method: "PUT",
      body: JSON.stringify(instance),
      headers: {
        "If-Match": instance.etag ?? "invalid-etag",
      },
    })
      .then(handleResponse)
      .then((data: LxdOperation) => {
        watchOperation(data.operation, TIMEOUT_120).then(resolve).catch(reject);
      })
      .catch(reject);
  });
};

export const renameInstance = (
  oldName: string,
  newName: string,
  project: string
) => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${oldName}?project=${project}`, {
      method: "POST",
      body: JSON.stringify({
        name: newName,
      }),
    })
      .then(handleResponse)
      .then((data: LxdOperation) => {
        watchOperation(data.operation, TIMEOUT_120).then(resolve).catch(reject);
      })
      .catch(reject);
  });
};

export const startInstance = (instance: LxdInstance) => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${instance.name}/state?project=${instance.project}`, {
      method: "PUT",
      body: '{"action": "start"}',
    })
      .then(handleResponse)
      .then((data: LxdOperation) => {
        watchOperation(data.operation, TIMEOUT_60).then(resolve).catch(reject);
      })
      .catch(reject);
  });
};

export const stopInstance = (instance: LxdInstance, isForce: boolean) => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${instance.name}/state?project=${instance.project}`, {
      method: "PUT",
      body: JSON.stringify({
        action: "stop",
        force: isForce,
      }),
    })
      .then(handleResponse)
      .then((data: LxdOperation) => {
        watchOperation(data.operation, TIMEOUT_60).then(resolve).catch(reject);
      })
      .catch(reject);
  });
};

export const freezeInstance = (instance: LxdInstance) => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${instance.name}/state?project=${instance.project}`, {
      method: "PUT",
      body: JSON.stringify({
        action: "freeze",
      }),
    })
      .then(handleResponse)
      .then((data: LxdOperation) => {
        watchOperation(data.operation, TIMEOUT_60).then(resolve).catch(reject);
      })
      .catch(reject);
  });
};

export const unfreezeInstance = (instance: LxdInstance) => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${instance.name}/state?project=${instance.project}`, {
      method: "PUT",
      body: '{"action": "unfreeze"}',
    })
      .then(handleResponse)
      .then((data: LxdOperation) => {
        watchOperation(data.operation, TIMEOUT_60).then(resolve).catch(reject);
      })
      .catch(reject);
  });
};

export const restartInstance = (instance: LxdInstance, isForce: boolean) => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${instance.name}/state?project=${instance.project}`, {
      method: "PUT",
      body: JSON.stringify({
        action: "restart",
        force: isForce,
      }),
    })
      .then(handleResponse)
      .then((data: LxdOperation) => {
        watchOperation(data.operation, TIMEOUT_60).then(resolve).catch(reject);
      })
      .catch(reject);
  });
};

export const deleteInstance = (instance: LxdInstance) => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${instance.name}?project=${instance.project}`, {
      method: "DELETE",
    })
      .then(handleResponse)
      .then((data: LxdOperation) => {
        watchOperation(data.operation).then(resolve).catch(reject);
      })
      .catch(reject);
  });
};

export const connectInstanceExec = (
  name: string,
  project: string,
  payload: TerminalConnectPayload
): Promise<LxdTerminal> => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${name}/exec?project=${project}&wait=10`, {
      method: "POST",
      body: JSON.stringify({
        command: [payload.command],
        "record-output": true,
        "wait-for-websocket": true,
        environment: payload.environment.reduce(
          (a, v) => ({ ...a, [v.key]: v.value }),
          {}
        ),
        interactive: true,
        group: payload.group,
        user: payload.user,
      }),
    })
      .then(handleResponse)
      .then((data: LxdTerminal) => resolve(data))
      .catch(reject);
  });
};

export const connectInstanceVga = (
  name: string,
  project: string
): Promise<LxdTerminal> => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${name}/console?project=${project}&wait=10`, {
      method: "POST",
      body: JSON.stringify({
        type: "vga",
        width: 0,
        height: 0,
      }),
    })
      .then(handleResponse)
      .then((data: LxdTerminal) => resolve(data))
      .catch(reject);
  });
};

export const connectInstanceConsole = (
  name: string,
  project: string
): Promise<LxdTerminal> => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${name}/console?project=${project}&wait=10`, {
      method: "POST",
      body: JSON.stringify({
        "wait-for-websocket": true,
        type: "console",
      }),
    })
      .then(handleResponse)
      .then((data: LxdTerminal) => resolve(data))
      .catch(reject);
  });
};

export const fetchInstanceConsoleBuffer = (
  name: string,
  project: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${name}/console?project=${project}`, {
      method: "GET",
    })
      .then(handleTextResponse)
      .then((data: string) => resolve(data))
      .catch(reject);
  });
};

export const fetchInstanceLogs = (
  name: string,
  project: string
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${name}/logs?project=${project}`, {
      method: "GET",
    })
      .then(handleResponse)
      .then((data: LxdApiResponse<string[]>) => resolve(data.metadata))
      .catch(reject);
  });
};

export const fetchInstanceLogFile = (
  name: string,
  project: string,
  file: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${name}/logs/${file}?project=${project}`, {
      method: "GET",
    })
      .then(handleTextResponse)
      .then((data: string) => resolve(data))
      .catch(reject);
  });
};