import { FC } from "react";
import { Input, Select, Textarea } from "@canonical/react-components";
import { FormikProps } from "formik/dist/types";
import { getConfigurationRow } from "components/ConfigurationRow";
import { NetworkFormValues } from "pages/networks/forms/NetworkForm";
import ScrollableConfigurationTable from "components/forms/ScrollableConfigurationTable";

interface Props {
  formik: FormikProps<NetworkFormValues>;
}

const NetworkFormDns: FC<Props> = ({ formik }) => {
  return (
    <ScrollableConfigurationTable
      rows={[
        ...(formik.values.networkType !== "physical"
          ? [
              getConfigurationRow({
                formik,
                name: "dns_domain",
                label: "DNS domain",
                defaultValue: "",
                children: <Input type="text" />,
              }),
            ]
          : []),

        ...(formik.values.networkType === "bridge"
          ? [
              getConfigurationRow({
                formik,
                name: "dns_mode",
                label: "DNS mode",
                defaultValue: "",
                children: (
                  <Select
                    options={[
                      {
                        label: "Select option",
                        value: "",
                        disabled: true,
                      },
                      {
                        label: "None",
                        value: "none",
                      },
                      {
                        label: "Managed",
                        value: "managed",
                      },
                      {
                        label: "Dynamic",
                        value: "dynamic",
                      },
                    ]}
                  />
                ),
              }),
            ]
          : []),

        ...(formik.values.networkType === "physical"
          ? [
              getConfigurationRow({
                formik,
                name: "dns_nameservers",
                label: "DNS nameservers",
                defaultValue: "",
                children: <Input type="text" />,
              }),
            ]
          : [
              getConfigurationRow({
                formik,
                name: "dns_search",
                label: "DNS search",
                defaultValue: "",
                children: <Textarea />,
              }),
            ]),
      ]}
    />
  );
};

export default NetworkFormDns;
