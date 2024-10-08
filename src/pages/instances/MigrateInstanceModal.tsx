import { FC, KeyboardEvent, useState } from "react";
import {
  ActionButton,
  Button,
  MainTable,
  Modal,
} from "@canonical/react-components";
import { LxdInstance } from "types/instance";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { fetchClusterMembers } from "api/cluster";
import Loader from "components/Loader";
import ScrollableTable from "components/ScrollableTable";

interface Props {
  close: () => void;
  migrate: (target: string, instance: LxdInstance) => void;
  instance: LxdInstance;
}

const MigrateInstanceModal: FC<Props> = ({ close, migrate, instance }) => {
  const { data: members = [], isLoading } = useQuery({
    queryKey: [queryKeys.cluster, queryKeys.members],
    queryFn: fetchClusterMembers,
  });

  const [selectedMember, setSelectedMember] = useState("");

  const handleEscKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      close();
    }
  };

  const handleMigrate = (instance: LxdInstance) => {
    migrate(selectedMember, instance);
    close();
  };

  const handleCancel = () => {
    if (selectedMember) {
      setSelectedMember("");
      return;
    }

    close();
  };

  const headers = [
    { content: "Name", sortKey: "name" },
    { content: "Roles", sortKey: "roles" },
    { content: "Architecture", sortKey: "architecture" },
    { content: "Status", sortKey: "status" },
    { "aria-label": "Actions", className: "actions" },
  ];

  const rows = members.map((member) => {
    const disableReason =
      member.server_name === instance.location
        ? "Instance already running on this member"
        : "";

    const selectMember = () => {
      if (disableReason) {
        return;
      }

      setSelectedMember(member.server_name);
    };

    return {
      className: "u-row",
      columns: [
        {
          content: (
            <div
              className="u-truncate migrate-instance-name"
              title={member.server_name}
            >
              {member.server_name}
            </div>
          ),
          role: "cell",
          "aria-label": "Name",
          onClick: selectMember,
        },
        {
          content: member.roles.join(", "),
          role: "cell",
          "aria-label": "Roles",
          onClick: selectMember,
        },
        {
          content: member.architecture,
          role: "cell",
          "aria-label": "Architecture",
          onClick: selectMember,
        },
        {
          content: member.status,
          role: "cell",
          "aria-label": "Status",
          onClick: selectMember,
        },
        {
          content: (
            <Button
              onClick={selectMember}
              dense
              title={disableReason}
              disabled={Boolean(disableReason)}
            >
              Select
            </Button>
          ),
          role: "cell",
          "aria-label": "Actions",
          className: "u-align--right",
          onClick: selectMember,
        },
      ],
      sortData: {
        name: member.server_name.toLowerCase(),
        roles: member.roles.join(", ").toLowerCase(),
        archietecture: member.architecture.toLowerCase(),
        status: member.status.toLowerCase(),
      },
    };
  });

  if (isLoading) {
    return <Loader />;
  }

  const modalTitle = selectedMember
    ? "Confirm migration"
    : `Choose target cluster member for instance ${instance.name}`;

  const summary = (
    <div className="migrate-instance-summary">
      <p>
        This will migrate instance <strong>{instance.name}</strong> to cluster
        member <b>{selectedMember}</b>.
      </p>
    </div>
  );

  return (
    <Modal
      close={close}
      className="migrate-instance-modal"
      title={modalTitle}
      buttonRow={
        <div id="migrate-instance-actions">
          <Button
            className="u-no-margin--bottom"
            type="button"
            aria-label="cancel migrate"
            appearance="base"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <ActionButton
            appearance="positive"
            className="u-no-margin--bottom"
            onClick={() => handleMigrate(instance)}
            disabled={!selectedMember}
          >
            Migrate
          </ActionButton>
        </div>
      }
      onKeyDown={handleEscKey}
    >
      {selectedMember ? (
        summary
      ) : (
        <div className="migrate-instance-table u-selectable-table-rows">
          <ScrollableTable
            dependencies={[]}
            tableId="migrate-instance-table"
            belowIds={["status-bar", "migrate-instance-actions"]}
          >
            <MainTable
              id="migrate-instance-table"
              headers={headers}
              rows={rows}
              sortable
              className="u-table-layout--auto"
            />
          </ScrollableTable>
        </div>
      )}
    </Modal>
  );
};

export default MigrateInstanceModal;
