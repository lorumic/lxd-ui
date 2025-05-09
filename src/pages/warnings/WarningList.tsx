import type { FC } from "react";
import { MainTable, Row, useNotify } from "@canonical/react-components";
import { fetchWarnings } from "api/warnings";
import { isoTimeToString } from "util/helpers";
import BaseLayout from "components/BaseLayout";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import Loader from "components/Loader";
import NotificationRow from "components/NotificationRow";
import HelpLink from "components/HelpLink";
import { useDocs } from "context/useDocs";

const WarningList: FC = () => {
  const docBaseLink = useDocs();
  const notify = useNotify();

  const {
    data: warnings = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: [queryKeys.warnings],
    queryFn: fetchWarnings,
    retry: false, // the api returns a 403 for users with limited permissions, surface the error right away
  });

  if (error) {
    notify.failure("Loading warnings failed", error);
  }

  const headers = [
    { content: "Type", sortKey: "type" },
    { content: "Last message", sortKey: "lastMessage" },
    { content: "Status", sortKey: "status" },
    { content: "Severity", sortKey: "severity" },
    { content: "Count", sortKey: "count", className: "u-align--right" },
    { content: "Project", sortKey: "project" },
    { content: "First seen", sortKey: "firstSeen" },
    { content: "Last seen", sortKey: "lastSeen" },
  ];

  const rows = warnings.map((warning) => {
    return {
      key: warning.uuid,
      columns: [
        {
          content: warning.type,
          role: "rowheader",
          "aria-label": "Type",
        },
        {
          content: warning.last_message,
          role: "cell",
          "aria-label": "Last message",
        },
        {
          content: warning.status,
          role: "cell",
          "aria-label": "Status",
        },
        {
          content: warning.severity,
          role: "cell",
          "aria-label": "Severity",
        },
        {
          content: warning.count,
          role: "cell",
          className: "u-align--right",
          "aria-label": "Count",
        },
        {
          content: warning.project,
          role: "cell",
          className: "u-align--center",
          "aria-label": "Project",
        },
        {
          content: isoTimeToString(warning.first_seen_at),
          role: "cell",
          "aria-label": "First seen",
        },
        {
          content: isoTimeToString(warning.last_seen_at),
          role: "cell",
          "aria-label": "Last seen",
        },
      ],
      sortData: {
        type: warning.type,
        lastMessage: warning.last_message.toLowerCase(),
        status: warning.status,
        severity: warning.severity,
        count: warning.count,
        project: warning.project.toLowerCase(),
        firstSeen: warning.first_seen_at,
        lastSeen: warning.last_seen_at,
      },
    };
  });

  return (
    <>
      <BaseLayout
        title={
          <HelpLink
            href={`${docBaseLink}/howto/troubleshoot/`}
            title="Learn more about troubleshooting"
          >
            Warnings
          </HelpLink>
        }
      >
        <NotificationRow />
        <Row>
          <MainTable
            headers={headers}
            rows={rows}
            paginate={30}
            responsive
            sortable
            className="u-table-layout--auto"
            emptyStateMsg={
              isLoading ? (
                <Loader text="Loading warnings..." />
              ) : (
                "No data to display"
              )
            }
          />
        </Row>
      </BaseLayout>
    </>
  );
};

export default WarningList;
