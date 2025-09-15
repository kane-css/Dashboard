import React, { useState } from 'react';
import '../ownercss/EditProfile.css';
import defaultProfile from "../../assets/modifikasi-logo.png";

export default function EditProfile() {
  const [profilePic, setProfilePic] = useState(defaultProfile);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(URL.createObjectURL(file));
    }
  };

  const handleShopNameChange = (e) => {
    setShopName(e.target.value);
  };

  const handleOwnerNameChange = (e) => {
    setOwnerName(e.target.value);
  };

  const handleContactChange = (e) => {
    setContact(e.target.value);
  };

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
  };

  const handleUpdate = () => {
    alert('Profile updated!');
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
          onChange={handleShopNameChange}
        />
        <input
          type="text"
          placeholder="Owner Name"
          value={ownerName}
          onChange={handleOwnerNameChange}
        />
        <input
          type="text"
          placeholder="Contact"
          value={contact}
          onChange={handleContactChange}
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={handleLocationChange}
        />
        <button onClick={handleUpdate}>Update Profile</button>
      </div>
    </div>
  );
}