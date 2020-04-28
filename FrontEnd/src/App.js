// src/App.js

import React from "react";
import { Router, Switch } from "react-router-dom";
import LoadingSpin from 'react-loading-spin';

import NavBar from "./components/NavBar";
import {EncryptedChat} from "./components/EncryptedChat";
import PrivateRoute from "./components/PrivateRoute";

import { useAuth0 } from "./react-auth0-spa";
import history from "./utils/history";

import './App.css';


function App() {
 
  const { isAuthenticated, loading } = useAuth0();
  
  if (loading) {
    return (
      <div className="container">
        <div className='subtitle'>
          <LoadingSpin
            duration = '2s'
            width = '15px'
            timingFunction = 'ease-in-out'
            size = '100px'
            primaryColor = 'blue'
            />
        </div> 
      </div>
    );
  }

  return (
    <div>
      <Router history={history}>
      {!isAuthenticated && (
        <header>
          <NavBar />
        </header>
      )}

        <Switch>
          <PrivateRoute path="/" component={EncryptedChat}>
          </PrivateRoute>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
