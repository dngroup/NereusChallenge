#!/bin/bash for Ubuntu 14.04

ipSessionmgt=$(docker inspect --format '{{ .NetworkSettings.Networks.stream.IPAddress }}' sessionmgt)

curl -X POST -u admin:admin http://$ipSessionmgt:9000/api/unsecure/docker/removeservers