echo "DOCKER_OPTS='-D -H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock'" >> /etc/default/docker

mkdir -p /etc/systemd/system/docker.service.d/

echo "[Service]\nEnvironmentFile=-/etc/default/docker\nExecStart=\nExecStart=/usr/bin/docker daemon $DOCKER_OPTS -H fd://" > /etc/systemd/system/docker.service.d/docker-defaults.conf

service docker restart