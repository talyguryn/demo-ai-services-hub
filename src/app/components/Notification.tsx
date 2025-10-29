// simple notification component with tailwindcss styles. params: title, message (string), type (success, error, info), showtime (number in ms) optional, position (top-right, top-left, bottom-right, bottom-left) optional
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { X } from "lucide-react";

// make a function to show notification
export const showNotification = (
  title: string,
  message: string,
  type: "success" | "error" | "info",
  showTime = 5000,
  position:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left" = "top-right"
) => {
  // create a div to hold the notification
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const handleClose = () => {
    // unmount the component and remove the div
    root.unmount();
    document.body.removeChild(container);
  };

  // render the Notification component
  root.render(
    <Notification
      title={title}
      message={message}
      type={type}
      showTime={showTime}
      position={position}
      onClose={handleClose}
    />
  );
};

interface NotificationProps {
  title: string;
  message: string;
  type: "success" | "error" | "info";
  showTime?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  onClose?: () => void;
}

const typeStyles = {
  success: "bg-green-100 border-green-500 text-green-700",
  error: "bg-red-100 border-red-500 text-red-700",
  info: "bg-blue-100 border-blue-500 text-blue-700",
};

const positionStyles = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
};

const Notification: React.FC<NotificationProps> = ({
  title,
  message,
  type,
  showTime = 5000,
  position = "top-right",
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, showTime);

    return () => clearTimeout(timer);
  }, [showTime, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed ${positionStyles[position]} w-96 border-l-4 p-4 shadow-lg rounded-md ${typeStyles[type]} z-50`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold mb-1">{title}</h4>
          <p className="text-sm">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Notification;
