const TimelineItem = ({ color, title, desc }) => (
  <div className="relative pl-8">
    {/* Dot on the vertical line */}
    <div
      className={`absolute left-0 top-2 w-4 h-4 rounded-full border-2 border-white shadow ${color}`}
    ></div>

    {/* Text */}
    <h4 className="font-semibold text-gray-800">{title}</h4>
    <p className="text-sm text-gray-600">{desc}</p>
  </div>
);

export default TimelineItem;
