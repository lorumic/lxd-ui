import { FC } from "react";
import { ActionButton, Icon } from "@canonical/react-components";
import usePortal from "react-useportal";
import { migrateInstance } from "api/instances";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { useEventQueue } from "context/eventQueue";
import ItemName from "components/ItemName";
import { useToastNotification } from "context/toastNotificationProvider";
import { LxdInstance } from "types/instance";
import { useInstanceLoading } from "context/instanceLoading";
import MigrateInstanceModal from "../MigrateInstanceModal";
import classNames from "classnames";
import { useSettings } from "context/useSettings";
import { isClusteredServer } from "util/settings";

interface Props {
  instance: LxdInstance;
  project: string;
  classname?: string;
  onClose?: () => void;
}

const MigrateInstanceBtn: FC<Props> = ({
  instance,
  project,
  classname,
  onClose,
}) => {
  const eventQueue = useEventQueue();
  const toastNotify = useToastNotification();
  const { openPortal, closePortal, isOpen, Portal } = usePortal();
  const queryClient = useQueryClient();
  const instanceLoading = useInstanceLoading();
  const { data: settings } = useSettings();
  const isClustered = isClusteredServer(settings);
  const isLoading =
    instanceLoading.getType(instance) === "Migrating" ||
    instance.status === "Migrating";

  const handleSuccess = (newTarget: string, instanceName: string) => {
    toastNotify.success(
      <>
        Instance <ItemName item={{ name: instanceName }} bold /> successfully
        migrated to <ItemName item={{ name: newTarget }} bold />
      </>,
    );
  };

  const notifyFailure = (e: unknown, instanceName: string) => {
    instanceLoading.setFinish(instance);
    toastNotify.failure(`Migration failed on instance ${instanceName}`, e);
  };

  const handleFailure = (msg: string, instanceName: string) => {
    notifyFailure(new Error(msg), instanceName);
  };

  const handleFinish = () => {
    void queryClient.invalidateQueries({
      queryKey: [queryKeys.instances, instance.name],
    });
    instanceLoading.setFinish(instance);
  };

  const handleMigrate = (target: string) => {
    instanceLoading.setLoading(instance, "Migrating");
    migrateInstance(instance.name, project, target)
      .then((operation) => {
        eventQueue.set(
          operation.metadata.id,
          () => handleSuccess(target, instance.name),
          (err) => handleFailure(err, instance.name),
          handleFinish,
        );
        toastNotify.info(`Migration started for instance ${instance.name}`);
        void queryClient.invalidateQueries({
          queryKey: [queryKeys.instances, instance.name, project],
        });
      })
      .catch((e) => {
        notifyFailure(e, instance.name);
      })
      .finally(() => {
        handleClose();
      });
  };

  const handleClose = () => {
    closePortal();
    onClose?.();
  };

  const isDisabled = isLoading || !!instanceLoading.getType(instance);

  return isClustered ? (
    <>
      {isOpen && (
        <Portal>
          <MigrateInstanceModal
            close={handleClose}
            migrate={handleMigrate}
            instance={instance}
          />
        </Portal>
      )}
      <ActionButton
        onClick={openPortal}
        type="button"
        className={classNames("u-no-margin--bottom has-icon", classname)}
        loading={isLoading}
        disabled={isDisabled}
        title="Migrate instance"
      >
        <Icon name="machines" />
        <span>Migrate</span>
      </ActionButton>
    </>
  ) : null;
};

export default MigrateInstanceBtn;
