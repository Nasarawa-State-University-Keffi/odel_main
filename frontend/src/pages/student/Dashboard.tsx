import { useState, useEffect } from "react";
import ApplicationLayout from "@/layouts/ApplicationLayout";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import DetailRow from "@/features/dashboard/components/DetailRow";
import TimelineItem from "@/features/dashboard/components/TimelineItem";
const defaultProfile = "/51760520.png";

const Dashboard = () => {
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [phone, setPhone] = useState("08145096343");
  const [profileImage, setProfileImage] = useState(defaultProfile);

  const handleUpdatePhone = () => {
    alert(`Phone updated to: ${phone}`);
    setShowPhoneForm(false);
  };

  const handleReset = () => {
    setPhone("08145096343");
    setProfileImage(defaultProfile);
    alert("Application reset to default values");
  };

  const handleUploadImage = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          setProfileImage(ev.target.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const timelineData = [
    { color: "bg-primary", title: "Admission", desc: "Open Distance and eLearning Application" },
    { color: "bg-primary", title: "Session", desc: "2025/2026" },
    { color: "bg-primary", title: "Mode of study", desc: "PART_TIME" },
    { color: "bg-destructive", title: "Status", desc: "APPLICATION_PENDING" },
  ];

  return (
    <ApplicationLayout>
      <div className="max-w-6xl mx-auto px-4 pt-20">
        <div className="bg-white rounded-lg shadow-sm border p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
          <hr className="border-gray-300 mb-8" />

          {/* 3-COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-8">

            {/* LEFT PANEL */}
            {/* LEFT PANEL */}
            <div className="flex flex-col items-center space-y-4 w-[180px] mx-auto lg:mx-0">
              {/* Profile image */}
              <div className="w-full h-[180px] bg-muted rounded-lg overflow-hidden transition-transform transform hover:scale-105">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Buttons */}
              <div className="w-full flex flex-col space-y-2">
                {/* Upload */}
                <label className="w-full cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadImage}
                  />
                  <Button className="w-full text-sm">
                    Upload Image
                  </Button>
                </label>

                {/* Reset */}
                <Button
                  variant="destructive"
                  className="w-full text-sm"
                  onClick={handleReset}
                >
                  Reset Application
                </Button>

                {/* Phone update toggle */}
                <div className="w-full flex flex-col">
                  <Button
                    variant="secondary"
                    className="w-full flex justify-between items-center p-2 text-xs"
                    onClick={() => setShowPhoneForm(!showPhoneForm)}
                  >
                    <span>Update phone</span>
                    <span
                      className={`transition-transform transform ${showPhoneForm ? "rotate-180" : "rotate-0"
                        }`}
                    >
                      ▼
                    </span>
                  </Button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${showPhoneForm ? "max-h-40 mt-2" : "max-h-0 mt-0"
                      }`}
                  >
                    <div className="flex flex-col space-y-2">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter new phone"
                        className="border border-gray-300 rounded p-2 w-full text-sm"
                      />
                      <Button
                        className="w-full text-sm"
                        onClick={handleUpdatePhone}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* CENTER PANEL — USER DETAILS */}
            <div className="flex flex-col space-y-4">
              <DetailRow label="Name" value="OSAMA Ibrahim Abdul" />
              <DetailRow label="Applicant ID" value="ghostking59@gmail.com" />
              <DetailRow label="Phone" value={phone} />
              <DetailRow label="Year of admission" value="2025/2026" />
              <DetailRow label="Programme Type" value="ODEL" />
              <DetailRow label="Faculty" value="Directorate of ODEL" />
              <DetailRow label="Department" value="Public Administration (ODEL)" />
              <DetailRow label="Programme" value="B.Sc Public Administration (ODEL)" />
              <DetailRow label="Mode of entry" value="100" />
            </div>

            {/* RIGHT PANEL — TIMELINE */}
            <div className="relative flex pl-6 lg:pl-10 mt-10 lg:mt-0">
              {/* Vertical line connecting dots */}
              <div className="absolute left-8 lg:left-12 top-0 bottom-0 w-[2px] bg-gray-300"></div>

              {/* Timeline items */}
              <div className="flex-1 flex flex-col space-y-10">
                {timelineData.map((item, idx) => (
                  <TimelineItem
                    key={idx}
                    color={item.color}
                    title={item.title}
                    desc={item.desc}
                  />
                ))}
              </div>
            </div>


          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
};

export default Dashboard;
