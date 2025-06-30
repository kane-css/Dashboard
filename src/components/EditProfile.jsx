import React, { useState } from 'react';
import './EditProfile.css';
import defaultProfile from '../assets/modifikasi-logo.png'; // Replace with your default image path

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
