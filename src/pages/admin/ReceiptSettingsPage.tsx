import ReceiptSettingsTab from "@/pages/admin/ReceiptSettingsTab";

const ReceiptSettingsPage = () => {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">
        Receipt Settings
      </h1>
      <ReceiptSettingsTab />
    </div>
  );
};

export default ReceiptSettingsPage;