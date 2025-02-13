{pkgs}: {
  deps = [
    pkgs.dbus
    pkgs.nspr
    pkgs.nss
    pkgs.glib
    pkgs.postgresql
  ];
}
