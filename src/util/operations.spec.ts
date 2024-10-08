import { getInstanceName, getProjectName } from "./operations";
import { LxdOperation } from "types/operation";

const craftOperation = (...url: string[]) => {
  const instances: string[] = [];
  const instances_snapshots: string[] = [];
  for (const u of url) {
    const segments = u.split("/");
    if (segments.length > 4) {
      instances_snapshots.push(u);
    } else {
      instances.push(u);
    }
  }

  return {
    resources: {
      instances,
      instances_snapshots,
    },
  } as LxdOperation;
};

describe("getInstanceName", () => {
  it("identifies instance name from an instance operation", () => {
    const operation = craftOperation("/1.0/instances/testInstance1");
    const name = getInstanceName(operation);

    expect(name).toBe("testInstance1");
  });

  it("identifies instance name from an instance operation in a custom project", () => {
    const operation = craftOperation(
      "/1.0/instances/testInstance2?project=project",
    );
    const name = getInstanceName(operation);

    expect(name).toBe("testInstance2");
  });

  it("identifies instance name from an instance creation operation with snapshot as source", () => {
    const operation = craftOperation(
      "/1.0/instances/targetInstanceName",
      "/1.0/instances/sourceInstanceName/testSnap",
    );
    const name = getInstanceName(operation);
    expect(name).toBe("targetInstanceName");
  });
});

describe("getProjectName", () => {
  it("identifies project name from an instance operation when no project parameter is present", () => {
    const operation = craftOperation("/1.0/instances/testInstance1");
    const name = getProjectName(operation);

    expect(name).toBe("default");
  });

  it("identifies project name from an instance operation in a custom project", () => {
    const operation = craftOperation(
      "/1.0/instances/testInstance2?project=fooProject",
    );
    const name = getProjectName(operation);

    expect(name).toBe("fooProject");
  });

  it("identifies project name from an instance operation in a custom project with other parameters", () => {
    const operation = craftOperation(
      "/1.0/instances/testInstance2?foo=bar&project=barProject",
    );
    const name = getProjectName(operation);

    expect(name).toBe("barProject");
  });
});
