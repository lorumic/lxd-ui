import { FC } from "react";
import OpenTerminalBtn from "./actions/OpenTerminalBtn";
import OpenConsoleBtn from "./actions/OpenConsoleBtn";
import { Button, Icon, List, useNotify } from "@canonical/react-components";
import usePanelParams from "util/usePanelParams";
import InstanceStateActions from "pages/instances/actions/InstanceStateActions";
import SidePanel from "components/SidePanel";
import InstanceDetailPanelContent from "./InstanceDetailPanelContent";
import { useInstance } from "context/useInstances";

const InstanceDetailPanel: FC = () => {
  const notify = useNotify();
  const panelParams = usePanelParams();

  const enable = panelParams.instance !== null;
  const {
    data: instance,
    error,
    isLoading,
  } = useInstance(panelParams.instance ?? "", panelParams.project, enable);

  if (error) {
    notify.failure("Loading instance failed", error);
  }

  return (
    <SidePanel
      loading={isLoading}
      hasError={!instance}
      className="u-hide--medium u-hide--small"
      width="narrow"
      pinned
    >
      <SidePanel.Container className="detail-panel instance-detail-panel">
        <SidePanel.Sticky>
          <SidePanel.Header>
            <SidePanel.HeaderTitle>Instance summary</SidePanel.HeaderTitle>
            <SidePanel.HeaderControls>
              <Button
                appearance="base"
                className="u-no-margin--bottom"
                hasIcon
                onClick={panelParams.clear}
                aria-label="Close"
              >
                <Icon name="close" />
              </Button>
            </SidePanel.HeaderControls>
          </SidePanel.Header>
          {instance && (
            <div className="actions">
              <List
                inline
                className="primary actions-list"
                items={[
                  <OpenTerminalBtn key="terminal" instance={instance} />,
                  <OpenConsoleBtn key="console" instance={instance} />,
                ]}
              />
              <div className="state">
                <InstanceStateActions instance={instance} />
              </div>
            </div>
          )}
        </SidePanel.Sticky>

        <SidePanel.Content>
          {instance && <InstanceDetailPanelContent instance={instance} />}
        </SidePanel.Content>
      </SidePanel.Container>
    </SidePanel>
  );
};

export default InstanceDetailPanel;
