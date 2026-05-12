import React from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar.jsx";

export default function Home() {
  return (
    <div className="page">
      <TopBar />

      {/* Banner */}
      <div className="hero">
        <img className="hero-img" src="/bannar.png" alt="banner" />
      </div>

      {/* Developer About Block */}
      <section className="dev-block">
        
        <div className="dev-info">
          

          <div className="dev-card">
            <h3>Contact</h3>
            <p>Name :Abdur Rahaman .   gmail: mabdurrahaman7@gmail.com GitHub :Abdur-r1.</p>
          </div>
        </div>
      </section>
    </div>
  );
}