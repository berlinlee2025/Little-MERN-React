import React, { useState, useEffect, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch
} from 'react-router-dom';

import Users from './user/pages/Users';
import NewPlace from './places/pages/NewPlace';
import UserPlaces from './places/pages/UserPlaces';
import UpdatePlace from './places/pages/UpdatePlace';
import Auth from './user/pages/Auth';
import MainNavigation from './shared/components/Navigation/MainNavigation';
import { AuthContext } from './shared/context/auth-context';

let logoutTimer; // behind the scenes data, declared outside React <App />

/* React is by default invulnerable to XSS, even using localStorage */
const App = () => {
  // const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ token, setToken ] = useState(false);
  const [ tokenExpirationDate, setTokenExpirationDate ] = useState(null);
  const [ userId, setUserId ] = useState(false);

  const login = useCallback((uid, token, expirationDate) => {
    setToken(token);
    setUserId(uid);

    // Declare Initial (shadowed) tokenExpirationDate before setState
    const tokenExpirationDate = expirationDate || new Date(new Date().getTime() + 60 * 60 * 1000); 

    // setState to make available when invoked in useEffect()
    setTokenExpirationDate(tokenExpirationDate); 

    /* Storing 'userData' in localStorage as {userId: uid, token: token } */
    localStorage.setItem('userData', 
      JSON.stringify({
        userId: uid, 
        token: token, 
        expiration: tokenExpirationDate.toISOString() 
      })
    );
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setTokenExpirationDate(null);
    localStorage.removeItem('userData');
    setUserId(null);
  }, []);

  useEffect(() => {
    if (token && tokenExpirationDate) { // token exists && tokenExpirationDate !== null
      
      const remainingTime = tokenExpirationDate.getTime() - new Date().getTime(); // Number in milli-seconds
      logoutTimer = setTimeout(logout, remainingTime);
    } else { // if (!token)
      clearTimeout(logoutTimer); // clear timer (ms) whenever 'token' changes
    }

  }, [token, logout, tokenExpirationDate]); /* Invoked to re-render whenever 'token'||'logout'||'tokenExpirationDate' changes */

  /* check localStorage for 'userData' on React app starts 
  useEffect(() => {}) runs after React return () cycle */
  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('userData'));
    if (storedData && storedData.token && new Date(storedData.expiration) > new Date()) {
      login(storedData.userId, storedData.token, new Date(storedData.expiration));
    }
  }, [login]);

  let routes;

  // if (isLoggedIn) {
  if (token) {
    routes = (
      <Switch>
        <Route path="/" exact>
          <Users />
        </Route>
        <Route path="/:userId/places" exact>
          <UserPlaces />
        </Route>
        <Route path="/places/new" exact>
          <NewPlace />
        </Route>
        <Route path="/places/:placeId">
          <UpdatePlace />
        </Route>
        <Redirect to="/" />
      </Switch>
    );
  } else {
    routes = (
      <Switch>
        <Route path="/" exact>
          <Users />
        </Route>
        <Route path="/:userId/places" exact>
          <UserPlaces />
        </Route>
        <Route path="/auth">
          <Auth />
        </Route>
        <Redirect to="/auth" />
      </Switch>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        // isLoggedIn: isLoggedIn,
        isLoggedIn: !!token,
        token: token,
        userId: userId,
        login: login,
        logout: logout
      }}
    >
      <Router>
        <MainNavigation />
        <main>{routes}</main>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
