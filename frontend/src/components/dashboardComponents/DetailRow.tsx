const DetailRow = ({ label, value }) => (
  <div className="flex items-center border-b pb-2 py-1">
    <span className="text-sm text-gray-500">{label}</span>

    {/* Spacer that grows and keeps huge clean space between label and value */}
    <div className="flex-grow"></div>

    <span className="text-sm font-medium text-gray-700">{value}</span>
  </div>
);

export default DetailRow;
