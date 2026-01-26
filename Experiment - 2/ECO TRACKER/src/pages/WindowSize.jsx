import { useEffect, useState } from "react";

const WindowSize = () => {
  const [height, setHeight] = useState(window.innerHeight);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const updateSize = () => {
      setHeight(window.innerHeight);
      setWidth(window.innerWidth);
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <>
      <h2>Height = {height} px</h2>
      <h2>Width = {width} px</h2>
    </>
  );
};

export default WindowSize;
