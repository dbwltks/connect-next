import React from "react";

interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: boolean;
  size?: "small";
}

export default function GlassContainer({
  className = "",
  children,
  rounded = false,
  size,
  ...rest
}: GlassContainerProps) {
  const sizeClass = size === "small" ? "glass-container--small" : "";
  return (
    <div
      className={[
        "glass-container",
        rounded && "glass-container--rounded",
        sizeClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <div className="glass-filter" />
      <div className="glass-overlay" />
      <div className="glass-specular" />
      <div className="glass-content">{children}</div>
    </div>
  );
}
