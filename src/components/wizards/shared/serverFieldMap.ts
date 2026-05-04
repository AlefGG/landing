/**
 * Default server-field → wizard-UI-field mappers used when the server returns
 * 400 with `field_errors`. Lifted from byte-identical switches that previously
 * duplicated across EventWizard/EmergencyWizard. Each wizard imports the
 * mapper that matches its order shape.
 *
 * Closes FE-CQ-015: mapServerField duplication across rental wizards.
 */

export const rentalServerFieldMap = (field: string): string | null => {
  if (field === "items") return "cabins";
  if (
    field === "install_date" ||
    field === "install_slot" ||
    field === "dismantle_date" ||
    field === "dismantle_slot" ||
    field === "date_start" ||
    field === "date_end"
  )
    return "installDismantle";
  if (field === "install_consent") return "installConsent";
  if (
    field === "address_lat" ||
    field === "address_lon" ||
    field === "address_text"
  )
    return "address";
  if (field === "logistics_type") return "logistics";
  if (field === "payment_channel") return "paymentChannel";
  return null;
};

export const constructionServerFieldMap = (field: string): string | null => {
  if (field === "months") return "duration";
  if (field === "start_date") return "startDate";
  if (field === "addresses") return "addresses";
  if (field === "logistics_type") return "logistics";
  if (field === "payment_channel") return "paymentChannel";
  return null;
};
