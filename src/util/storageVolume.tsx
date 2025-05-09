import type { AbortControllerState } from "./helpers";
import { capitalizeFirstLetter, checkDuplicateName } from "./helpers";
import type { AnyObject, TestContext, TestFunction } from "yup";
import type { LxdStorageVolume } from "types/storage";
import type { StorageVolumeFormValues } from "pages/storage/forms/StorageVolumeForm";

export const testCopyStorageVolumeName = (
  project: string,
  volumeType: string,
  controllerState: AbortControllerState,
  previousName?: string,
): [string, string, TestFunction<string | undefined, AnyObject>] => {
  return [
    "deduplicate",
    "A storage volume with this name already exists",
    async (value?: string, context?: TestContext) => {
      const pool = (context?.parent as StorageVolumeFormValues).pool;
      return (
        value === previousName ||
        checkDuplicateName(
          value,
          project,
          controllerState,
          `storage-pools/${pool}/volumes/${volumeType}`,
        )
      );
    },
  ];
};

const storageVolumeFormFieldToPayloadName: Record<string, string> = {
  size: "size",
  security_shifted: "security.shifted",
  security_unmapped: "security.unmapped",
  snapshots_expiry: "snapshots.expiry",
  snapshots_pattern: "snapshots.pattern",
  snapshots_schedule: "snapshots.schedule",
  block_filesystem: "block.filesystem",
  block_mount_options: "block.mount_options",
  block_type: "block.type",
  zfs_blocksize: "zfs.blocksize",
  zfs_block_mode: "zfs.block_mode",
  zfs_delegate: "zfs.delegate",
  zfs_remove_snapshots: "zfs.remove_snapshots",
  zfs_use_refquota: "zfs.use_refquota",
  zfs_reserve_space: "zfs.reserve_space",
};

export const getFilesystemVolumeFormFields =
  (): (keyof StorageVolumeFormValues)[] => {
    return Object.keys(storageVolumeFormFieldToPayloadName).filter((item) =>
      item.startsWith("block_"),
    ) as (keyof StorageVolumeFormValues)[];
  };

export const getZfsVolumeFormFields = (): (keyof StorageVolumeFormValues)[] => {
  return Object.keys(storageVolumeFormFieldToPayloadName).filter((item) =>
    item.startsWith("zfs_"),
  ) as (keyof StorageVolumeFormValues)[];
};

export const getVolumeKey = (key: string): string => {
  if (key in storageVolumeFormFieldToPayloadName) {
    return storageVolumeFormFieldToPayloadName[key];
  }
  return key;
};

export const getVolumeConfigKeys = (): Set<string> => {
  return new Set(Object.values(storageVolumeFormFieldToPayloadName));
};

export const renderVolumeType = (volume: LxdStorageVolume): string => {
  return volume.type === "virtual-machine"
    ? "VM"
    : capitalizeFirstLetter(volume.type);
};

export const renderContentType = (volume: LxdStorageVolume): string => {
  return volume.content_type === "iso"
    ? "ISO"
    : capitalizeFirstLetter(volume.content_type);
};

export const isSnapshot = (volume: LxdStorageVolume): boolean => {
  return volume.name.includes("/");
};

export const splitVolumeSnapshotName = (
  fullVolumeName: string,
): { snapshotName: string; volumeName: string } => {
  const fullVolumeNameSplit = fullVolumeName.split("/");
  const snapshotName = fullVolumeNameSplit.pop() || "";
  const volumeName = fullVolumeNameSplit.join("");
  return {
    snapshotName,
    volumeName,
  };
};

export const getSnapshotsPerVolume = (volumes: LxdStorageVolume[]) => {
  const snapshotPerVolumeLookup: { [volumeName: string]: string[] } = {};
  for (const volume of volumes) {
    if (isSnapshot(volume)) {
      const { volumeName, snapshotName } = splitVolumeSnapshotName(volume.name);
      if (!snapshotPerVolumeLookup[volumeName]) {
        snapshotPerVolumeLookup[volumeName] = [];
      }

      snapshotPerVolumeLookup[volumeName].push(snapshotName);
    }
  }

  return snapshotPerVolumeLookup;
};

const collapsedViewMaxWidth = 1250;
export const figureCollapsedScreen = (): boolean =>
  window.innerWidth <= collapsedViewMaxWidth;

export const generateLinkForVolumeDetail = (
  volume: LxdStorageVolume,
  project: string,
): string => {
  // NOTE: name of a volume created from an instance is exactly the same as the instance name
  if (volume.type === "container" || volume.type === "virtual-machine") {
    return `/ui/project/${project}/instance/${volume.name}`;
  }

  if (volume.type === "image") {
    return `/ui/project/${project}/images`;
  }

  if (volume.type === "custom" && volume.content_type === "iso") {
    return `/ui/project/${project}/storage/custom-isos`;
  }

  return `/ui/project/${project}/storage/pool/${volume.pool}/volumes/${volume.type}/${volume.name}`;
};

export const hasVolumeDetailPage = (volume: LxdStorageVolume): boolean => {
  return generateLinkForVolumeDetail(volume, "").includes("/storage/pool/");
};
