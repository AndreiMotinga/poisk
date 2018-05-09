import axios from "axios";
import {
  init,
  // requestStart,
  signupRequest,
  signupFailure,
  signinRequest,
  signinSuccess,
  signinFailure,
  signoutRequest,
  signoutFailure,
  signoutSuccess
} from "./actions";
import history from "config/history";

/**
 * Main object to handle api requests
 * contains useful methods to persist headers, interact with localStorage etc
 */
class Api {
  constructor() {
    this.key = process.env.REACT_APP_LOCAL_STORAGE_KEY;
    this.api_url = process.env.REACT_APP_API_URL;
  }

  /**
   * read headers from local storage.
   * Useful when user stays signedin, but leaves page and then comes back.
   */
  headers() {
    const headers = localStorage.getItem(this.key);
    return JSON.parse(headers) || {};
  }

  /**
   * server response with new token after each request.
   * call this with recevied headers to save uid, client and token.
   */
  cycleHeaders(recevied) {
    const headers = {};
    headers["access-token"] = recevied["access-token"];
    headers["client"] = recevied["client"];
    headers["uid"] = recevied["uid"];

    this.headers = headers;

    // update headers in localStorage
    localStorage.setItem(this.key, JSON.stringify(headers));

    return;
  }

  /**
   * Checks if user already signed in upon visiting by
   * making GET to `/auth/validate_token`.
   * If current token on server and locally stored token are the same
   * sets currentUser in store
   */
  initUser() {
    const headers = this.headers();

    return dispatch => {
      // don't validate if saved headers don't have uid in them,
      // a.k.a isn't signedin
      if (!headers.uid) {
        return dispatch(init(null));
      }

      return axios
        .get(`${this.api_url}/auth/validate_token`, { headers })
        .then(res => {
          this.cycleHeaders(res.headers);
          const currentUser = res.data.data;
          dispatch(init(currentUser));
        })
        .catch(err => {
          // user isn't saved locally.
          // we don't have init_request, init_succes and init_failure actions
          // so dispatching init with null
          dispatch(init(null));
        });
    };
  }

  /**
   * Registers user.
   * makes POST request to `/auth`
   * dispatches SIGNUP_REQUEST => SIGNUP_SUCCESS || SIGNUP_FAILURE
   */
  signup(email, password) {
    return dispatch => {
      dispatch(signupRequest());
      return axios
        .post(`${this.api_url}/auth`, {
          email,
          password,
          password_confirmation: password
        })
        .then(res => {
          this.cycleHeaders(res.headers);
          const currentUser = res.data.data;
          dispatch(signinSuccess(currentUser));
          history.push("/");
        })
        .catch(err => {
          const errors = err.response.data.errors.full_messages;
          dispatch(signupFailure(errors));
        });
    };
  }

  /**
   * Sigin user.
   * makes POST request to `/auth/sign_in`
   * dispatches SIGNIN_REQUEST => SIGNIN_SUCCESS || SIGNIN_FAILURE
   */
  signin(email, password) {
    return dispatch => {
      dispatch(signinRequest());
      return axios
        .post(`${this.api_url}/auth/sign_in`, {
          email,
          password
        })
        .then(res => {
          this.cycleHeaders(res.headers);
          const currentUser = res.data.data;
          dispatch(signinSuccess(currentUser));
          history.push("/");
        })
        .catch(err => {
          const errors = err.response.data.errors;
          dispatch(signinFailure(errors));
        });
    };
  }

  /**
   * Sigout user.
   * makes DELETE request to `/auth/sign_out`
   * dispatches SIGNOUT_REQUEST => SIGNOUT_SUCCESS || SIGNOUT_FAILURE
   */
  signout() {
    return dispatch => {
      dispatch(signoutRequest());
      return axios
        .delete(`${this.api_url}/auth/sign_out`, { headers: this.headers })
        .then(res => {
          this.cycleHeaders(res.headers);
          dispatch(signoutSuccess());
        })
        .catch(err => {
          const errors = err.response.data.errors.full_messages;
          dispatch(signoutFailure(errors));
        });
    };
  }

  getUserListings() {
    return axios
      .get(`${this.api_url}/users/listings`, { headers: this.headers })
      .then(res => res.data.data);
  }

  getListings(params) {
    return axios.get(`${this.api_url}/listings`, { params }).then(res => res.data);
  }

  editListing(id) {
    return axios.get(`${this.api_url}/listings/${id}/edit`, { headers: this.headers });
  }

  getListing(id) {
    return axios.get(`${this.api_url}/listings/${id}`);
  }

  saveListing(listing) {
    return axios.put(
      `${this.api_url}/listings/${listing.id}`,
      { listing },
      { headers: this.headers }
    );
  }

  removeListing(id) {
    const headers = this.headers;
    return axios.delete(`${this.api_url}/listings/${id}`, { headers });
  }

  getStates() {
    return axios.get(`${this.api_url}/states/`).then(res => res.data);
  }

  getCities(state, all_states = false) {
    const params = {};
    if (state) {
      params.state = state;
    }
    if (all_states) {
      params.all = 1;
    }
    return axios.get(`${this.api_url}/cities`, { params }).then(res => res.data);
  }

  savePicture(picture) {
    const headers = this.headers;
    return axios.post(`${this.api_url}/pictures`, picture, { headers });
  }

  removePicture(id) {
    const headers = this.headers;
    return axios.delete(`${this.api_url}/pictures/${id}`, { headers });
  }

  saveUser(user) {
    const headers = this.headers;
    return axios.put(`${this.api_url}/users/${user.id}`, { user }, { headers });
  }
}

export default new Api();
