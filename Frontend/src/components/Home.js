import React from "react";
import Products from "./Products";
import Carousel from "./Carousel";
export default function Home() {
  return (
    <>
      <div className="container">
        <Carousel />
        <h1 className="text-center my-4 text-white ">Welcome to ShopSphere</h1>
        <p className="text-center text-white">
          Your one-stop shop for all your needs!
        </p>
        <Products />
      </div>
    </>
  );
}
