#!/bin/bash for Ubuntu 14.04

if [ $# -ne 2 ]
then
  echo "Please write : bash launchNetworks.sh [nb interfaces] [nb servers]"
  exit;
fi

interfaces=$1
servers=$2
ipSessionmgt=$(docker inspect --format '{{ .NetworkSettings.Networks.stream.IPAddress }}' sessionmgt)

curl -X POST -u admin:admin http://$ipSessionmgt:9000/api/unsecure/docker/createservers/$interfaces/$servers