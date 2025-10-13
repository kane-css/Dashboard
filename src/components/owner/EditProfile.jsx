import React, { useState } from "react";
import "../ownercss/EditProfile.css";
import defaultProfile from "../../assets/modifikasi-logo.png";
import { supabase } from "../../supabase";
import { updateProfile, uploadProfileImage } from "../../services/profileService";

export default function EditProfile() {
  const [profilePic, setProfilePic] = useState(defaultProfile);
  const [profileFile, setProfileFile] = useState(null);
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileFile(file); 
      setProfilePic(URL.createObjectURL(file)); // preview only
    }
  };

  const handleUpdate = async () => {
    try {
      // get logged in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("No logged in user");

      // upload profile image if selected
      let uploadedUrl = null;
      if (profileFile) {
        uploadedUrl = await uploadProfileImage(profileFile, user.id);
      }

      // update profiles tables
      const updates = {
        shop_name: shopName,
        owner_name: ownerName,
        contact: contact,
        location: location,
        profile_pic: uploadedUrl || profilePic
      };

      const data = await updateProfile(user.id, updates);

      alert("Profile updated successfully!");
      console.log("Updated data:", data);
    } catch (err) {
      console.error("Update failed:", err.message);
      alert("Error updating profile: " + err.message);
    }
  };

  return (
    <div className="edit-container">
      <div className="edit-box">
        <div className="profile-pic-container">
          <img src={profilePic} alt="Profile" className="profile-pic" />
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </div>
        <input
          type="text"
          placeholder="Shop Name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Owner Name"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button onClick={handleUpdate}>Update Profile</button>
      </div>
    </div>
  );
}
