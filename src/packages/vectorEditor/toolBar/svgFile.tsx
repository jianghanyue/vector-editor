export const PenSVG = () => {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path
        fill="#fff"
        fillRule="evenodd"
        d="m18.174 14.902.182-.578c.496-1.581.17-3.384-1.563-5.117-.43-.431-1.11-.87-1.999-1.294-.877-.42-1.904-.8-2.982-1.14-2.027-.636-4.174-1.104-5.734-1.402l4.906 4.906a2 2 0 1 1-.707.707L5.372 6.078c.297 1.56.766 3.707 1.402 5.733.695 2.213 1.532 4.08 2.433 4.982 1.734 1.733 3.537 2.059 5.118 1.562l.578-.181.428.428L16.728 20 20 16.727l-1.397-1.397zm1.136-.28 1.397 1.398a1 1 0 0 1 0 1.415l-3.272 3.271a1 1 0 0 1-1.414 0l-1.397-1.397c-1.974.62-4.157.158-6.124-1.81-2.184-2.183-3.573-8.342-4.167-11.531a1.39 1.39 0 0 1 1.635-1.636c3.19.595 9.348 1.984 11.532 4.167 1.967 1.967 2.43 4.15 1.81 6.124m-6.603-1.915a1 1 0 1 0-1.414-1.415 1 1 0 0 0 1.414 1.415"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const SelectSVG = () => {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <mask
        id=":ri:"
        width="17"
        height="17"
        x="4"
        y="4"
        fill="#000"
        maskUnits="userSpaceOnUse"
      >
        <path fill="#fff" d="M4 4h17v17H4z"></path>
        <path
          fillRule="evenodd"
          d="M19.294 12.063a1 1 0 0 0 .072-1.887l-13-5.107a1 1 0 0 0-1.297 1.297l5.107 13a1 1 0 0 0 1.887-.072l1.701-5.53z"
          clipRule="evenodd"
        ></path>
      </mask>
      <path
        fill="#fff"
        d="M19.294 12.063 19 11.107zm.072-1.887.365-.93zm-13-5.107.365-.93zM5.069 6.366l-.93.365zm5.107 13-.93.365zm1.887-.072L11.107 19zm1.701-5.53-.294-.955a1 1 0 0 0-.661.661zM19 11.107l.588 1.912a2 2 0 0 0 1.41-1.836zm0 0 1.999.076a2 2 0 0 0-1.268-1.937zM6 6l13 5.107.731-1.861-13-5.107zm0 0 .731-1.861a2 2 0 0 0-2.145.447zm0 0L4.586 4.586a2 2 0 0 0-.447 2.145zm5.107 13L6 6l-1.861.731 5.107 13zm0 0-1.861.731A2 2 0 0 0 11.183 21zm0 0 .076 1.999a2 2 0 0 0 1.836-1.41zm1.702-5.53L11.107 19l1.912.588 1.701-5.53zM19 11.107l-5.53 1.702.588 1.911 5.53-1.701z"
        mask="url(#:ri:)"
      ></path>
    </svg>
  );
};
