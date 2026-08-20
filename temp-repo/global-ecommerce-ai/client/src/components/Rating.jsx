import React from "react";

const Rating = ({
  value = 0,
  text = "",
}) => {
  return (
    <div className="flex items-center gap-1">
      <span>
        {value >= 1 ? "⭐" : "☆"}
      </span>

      <span>
        {value >= 2 ? "⭐" : "☆"}
      </span>

      <span>
        {value >= 3 ? "⭐" : "☆"}
      </span>

      <span>
        {value >= 4 ? "⭐" : "☆"}
      </span>

      <span>
        {value >= 5 ? "⭐" : "☆"}
      </span>

      {text && (
        <span className="ml-2 text-sm text-gray-600">
          {text}
        </span>
      )}
    </div>
  );
};

export default Rating;