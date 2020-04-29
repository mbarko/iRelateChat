// src/components/NavBar.js

import React from "react";
import { useAuth0 } from "../react-auth0-spa";

const Clear = async (virgil, logout) =>{
  const url = process.env.REACT_APP_Client;
  if (virgil) {
    const eThree = virgil.eThree;
    await eThree.cleanup();
    await logout({
      returnTo: url
    });
  } else {
    await logout({
      returnTo: url
    });
  }
}

const NavBar = (prop) => {
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();

  return (
    <div className="floatright">
      {!isAuthenticated && (
        <button onClick={() => loginWithRedirect({})}>Log in</button>
      )}

      {isAuthenticated && <button onClick={() => Clear(prop.virgil, logout)}>Log out</button>}
    </div>
  );
};

export default NavBar;