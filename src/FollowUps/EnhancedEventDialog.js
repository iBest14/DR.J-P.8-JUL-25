// src/FollowUps/EnhancedEventDialog.js
import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, User, FileText, Trash2 } from "lucide-react";
import { validateEvent } from "./eventSchema";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const EVENT_COLORS = [
  { value: "red", label: "Red", color: "#ef4444" },
  { value: "blue", label: "Blue", color: "#3b82f6" },
  { value: "green", label: "Green", color: "#10b981" },
  { value: "yellow", label: "Yellow", color: "#eab308" },
  { value: "purple", label: "Purple", color: "#8b5cf6" },
  { value: "pink", label: "Pink", color: "#ec4899" },
  { value: "orange", label: "Orange", color: "#f97316" },
];

const EnhancedEventDialog = ({ 
  open, 
  onClose, 
  event = null, 
  onSave,
  onDelete,
  defaultDate = null,
  defaultTime = null 
}) => {
  const [formData, setFormData] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "10:00",
    color: "blue",
    description: "",
    responsible: "Alice Johnson",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        date: event.date || format(new Date(), "yyyy-MM-dd"),
        startTime: event.startTime || "09:00",
        endTime: event.endTime || "10:00",
        color: event.color || "blue",
        description: event.description || "",
        responsible: event.responsible || "Alice Johnson",
      });
    } else {
      setFormData({
        title: "",
        date: defaultDate || format(new Date(), "yyyy-MM-dd"),
        startTime: defaultTime || "09:00",
        endTime: defaultTime ? addHour(defaultTime) : "10:00",
        color: "blue",
        description: "",
        responsible: "Alice Johnson",
      });
    }
    setErrors({});
  }, [event, defaultDate, defaultTime, open]);

  const addHour = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const newHours = (hours + 1) % 24;
    return `${String(newHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleSubmit = () => {
    const validation = validateEvent(formData);
    
    if (!validation.success) {
      const newErrors = {};
      validation.errors.forEach(error => {
        newErrors[error.path[0]] = error.message;
      });
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div 
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 pb-0">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {event ? event.title : "Add Event"}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* View mode for existing events */}
                {event && (
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Responsible</span>
                      <span className="ml-auto text-sm font-medium">{formData.responsible}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Start Date</span>
                      <span className="ml-auto text-sm">
                        {format(new Date(formData.date), "EEEE dd MMMM 'at' ")}
                        {formData.startTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">End Date</span>
                      <span className="ml-auto text-sm">
                        {format(new Date(formData.date), "EEEE dd MMMM 'at' ")}
                        {formData.endTime}
                      </span>
                    </div>

                    {formData.description && (
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Description</span>
                        </div>
                        <p className="text-sm text-gray-700 ml-7">
                          {formData.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit form for new events */}
                {!event && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter event title"
                      />
                      {errors.title && (
                        <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => handleChange("date", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color
                        </label>
                        <div className="flex gap-2">
                          {EVENT_COLORS.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => handleChange("color", color.value)}
                              className={`w-8 h-8 rounded-full transition-transform ${
                                formData.color === color.value ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : ""
                              }`}
                              style={{ backgroundColor: color.color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => handleChange("startTime", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => handleChange("endTime", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add description..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 flex gap-2">
                {event ? (
                  <>
                    <button
                      onClick={() => {
                        // Switch to edit mode
                        // This would typically toggle an edit state
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(event.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!formData.title}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Event
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EnhancedEventDialog;