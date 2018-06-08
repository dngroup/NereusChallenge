#!/bin/bash for Ubuntu 14.04

ipSessionmgt=$(docker inspect --format '{{ .NetworkSettings.Networks.stream.IPAddress }}' sessionmgt)

curl -X GET -u admin:admin http://$ipSessionmgt:9000/api/unsecure/docker/reloadservers
