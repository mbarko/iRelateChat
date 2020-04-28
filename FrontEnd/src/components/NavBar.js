// src/components/NavBar.js

import React from "react";
import { useAuth0 } from "../react-auth0-spa";

const Clear = (virgil, logout) =>{
  if (virgil) {
    const eThree = virgil.eThree;
    eThree.cleanup()
      .then(() => {
        console.log('success');
        logout();
      })
      .catch(e => console.error('error: ', e.message));
  } else {
    logout();
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