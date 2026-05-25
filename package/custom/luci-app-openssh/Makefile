include $(TOPDIR)/rules.mk

PKG_VERSION:=1
PKG_RELEASE:=1

LUCI_TITLE:=LuCI OpenSSH management
LUCI_DEPENDS:=+luci-base +openssh-server
LUCI_PKGARCH:=all

PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
