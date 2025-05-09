import type { FC } from "react";
import { useState } from "react";
import { useFormik } from "formik";
import { useToastNotification } from "context/toastNotificationProvider";
import {
  ActionButton,
  Button,
  Form,
  Input,
  Modal,
  Select,
} from "@canonical/react-components";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useEventQueue } from "context/eventQueue";
import type { LxdStorageVolume } from "types/storage";
import StoragePoolSelector from "../StoragePoolSelector";
import { checkDuplicateName, getUniqueResourceName } from "util/helpers";
import ResourceLink from "components/ResourceLink";
import { useProjects } from "context/useProjects";
import { useLoadCustomVolumes } from "context/useVolumes";
import ClusterMemberSelector from "pages/cluster/ClusterMemberSelector";
import { useStoragePool } from "context/useStoragePools";
import { isRemoteStorage } from "util/storageOptions";
import { copyStorageVolume } from "api/storage-volumes";

interface Props {
  volume: LxdStorageVolume;
  close: () => void;
}

export interface StorageVolumeCopy {
  name: string;
  project: string;
  pool: string;
  copySnapshots: boolean;
  location: string;
}

const CopyVolumeForm: FC<Props> = ({ volume, close }) => {
  const toastNotify = useToastNotification();
  const controllerState = useState<AbortController | null>(null);
  const navigate = useNavigate();
  const eventQueue = useEventQueue();

  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: pool } = useStoragePool(volume.pool);
  const { data: volumes = [], isLoading: volumesLoading } =
    useLoadCustomVolumes(volume.project);

  const notifySuccess = (volumeName: string, project: string, pool: string) => {
    const volumeUrl = `/ui/project/${project}/storage/pool/${pool}/volumes/custom/${volumeName}`;
    const message = (
      <>
        Created volume{" "}
        <ResourceLink type="volume" value={volumeName} to={volumeUrl} />.
      </>
    );

    const actions = [
      {
        label: "Configure",
        onClick: async () => navigate(`${volumeUrl}/configuration`),
      },
    ];

    toastNotify.success(message, actions);
  };

  const getCopiedVolumeName = (volume: LxdStorageVolume): string => {
    const newVolumeName = volume.name + "-copy";
    return getUniqueResourceName(newVolumeName, volumes);
  };

  // this validation checks given changes in any one of the fields (name, project, pool)
  // if the volume name already exists in the target project and storage pool
  const validationSchema = Yup.object()
    .shape({
      name: Yup.string().required("Volume name is required"),
      project: Yup.string().required(),
      pool: Yup.string().required(),
    })
    .test("deduplicate", "", async function (values) {
      const { name, project, pool } = values;
      const notFound = await checkDuplicateName(
        name,
        project || "default",
        controllerState,
        `storage-pools/${pool}/volumes/custom`,
      );

      if (notFound) {
        return true;
      }

      return this.createError({
        path: "name",
        message:
          "A volume with this name already exist in the target project and storage pool",
      });
    });

  const formik = useFormik<StorageVolumeCopy>({
    initialValues: {
      name: getCopiedVolumeName(volume),
      project: volume.project,
      copySnapshots: true,
      pool: volume.pool,
      location: isRemoteStorage(pool?.driver ?? "") ? "" : volume.location,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      const payload: Partial<LxdStorageVolume> = {
        name: values.name,
        type: "custom",
        config: volume.config,
        description: volume.description,
        content_type: volume.content_type,
        source: {
          name: volume.name,
          type: "copy",
          pool: volume.pool,
          volume_only: !values.copySnapshots,
          // logic from the lxc source code.
          // We should not set source.project if target project is the same as the source project
          project:
            values.project !== volume.project ? volume.project : undefined,
          location: volume.location,
        },
      };

      const existingVolumeLink = (
        <ResourceLink
          type="volume"
          value={volume.name}
          to={`/ui/project/${volume.project}/storage/pool/${volume.pool}/volumes/custom/${volume.name}`}
        />
      );

      copyStorageVolume(payload, values.pool, values.project, values.location)
        .then((operation) => {
          toastNotify.info(<>Copy of volume {existingVolumeLink} started.</>);
          eventQueue.set(
            operation.metadata.id,
            () => {
              notifySuccess(values.name, values.project, values.pool);
            },
            (msg) =>
              toastNotify.failure(
                "Volume copy failed.",
                new Error(msg),
                existingVolumeLink,
              ),
          );
          close();
        })
        .catch((e) => {
          toastNotify.failure("Volume copy failed.", e, existingVolumeLink);
        });
    },
  });

  return (
    <Modal
      close={close}
      className="copy-volumes-modal"
      title="Copy volume"
      buttonRow={
        <>
          <Button
            appearance="base"
            className="u-no-margin--bottom"
            type="button"
            onClick={close}
          >
            Cancel
          </Button>
          <ActionButton
            appearance="positive"
            className="u-no-margin--bottom"
            loading={formik.isSubmitting}
            disabled={!formik.isValid || projectsLoading || volumesLoading}
            onClick={() => void formik.submitForm()}
          >
            Copy
          </ActionButton>
        </>
      }
    >
      <Form onSubmit={formik.handleSubmit}>
        <Input
          {...formik.getFieldProps("name")}
          type="text"
          label="New volume name"
          error={formik.touched.name ? formik.errors.name : null}
        />
        <StoragePoolSelector
          value={formik.values.pool}
          setValue={(value) => void formik.setFieldValue("pool", value)}
          selectProps={{
            id: "pool",
            label: "Storage pool",
          }}
        />
        {!isRemoteStorage(pool?.driver ?? "") && (
          <ClusterMemberSelector {...formik.getFieldProps("location")} />
        )}
        <Select
          {...formik.getFieldProps("project")}
          id="project"
          label="Target project"
          options={projects.map((project) => {
            return {
              label: project.name,
              value: project.name,
            };
          })}
        />
        <Input
          {...formik.getFieldProps("copySnapshots")}
          type="checkbox"
          label="Copy with snapshots"
          checked={formik.values.copySnapshots}
          error={
            formik.touched.copySnapshots ? formik.errors.copySnapshots : null
          }
        />
        {/* hidden submit to enable enter key in inputs */}
        <Input type="submit" hidden value="Hidden input" />
      </Form>
    </Modal>
  );
};

export default CopyVolumeForm;
