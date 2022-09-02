import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

//provider, consumer - GithubContext.Provider

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  //requst loading
  const [request, setRequest] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });

  //
  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);

    const res = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (res) {
      setGithubUser(res.data);

      const { login, followers_url } = res.data;
      //repos
      // axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((res) =>
      //   setRepos(res.data)
      // );

      //followers
      // axios(`${followers_url}`).then((res) => setFollowers(res.data));

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        ,
        axios(`${followers_url}`),
      ])
        .then((results) => {
          const [repos, followers] = results;
          const status = "fulfiled";
          if (repos.status === status) {
            setRepos(repos.value.data);
          }
          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
        })
        .catch((err) => console.log(err));
    } else {
      toggleError(true, "there is no user with that user name");
    }
    checkRequest();
    setIsLoading(false);
  };

  //check rate
  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        // remaining = 0;
        setRequest(remaining);
        if (remaining === 0) {
          //error
          toggleError(true, "sorry, you have exceeded your hourly rate limit!");
        }
      })
      .catch((err) => console.log(err));
  };

  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }

  useEffect(checkRequest, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        request,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
