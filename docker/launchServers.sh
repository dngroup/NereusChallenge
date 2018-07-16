docker network create iface1
docker network create iface2
docker network create iface3
docker network create iface4
docker network create iface5
docker network create iface6
docker network create iface7
docker network create iface8
docker network create iface9

docker run -d --expose "8080" --name server1 --net=iface1 -e VIRTUAL_DOMAIN=localhost -e VIRTUAL_HOST=server1 mlacaud/server_eval
docker run -d --expose "8080" --name server2 --net=iface1 -e VIRTUAL_DOMAIN=localhost -e VIRTUAL_HOST=server2 mlacaud/server_eval
docker run -d --expose "8080" --name server3 --net=iface1 -e VIRTUAL_DOMAIN=localhost -e VIRTUAL_HOST=server3 mlacaud/server_eval

docker network connect iface2 server1
docker network connect iface3 server1
docker network connect iface4 server1
docker network connect iface5 server1
docker network connect iface6 server1
docker network connect iface7 server1
docker network connect iface8 server1
docker network connect iface9 server1

docker network connect iface2 server2
docker network connect iface3 server2
docker network connect iface4 server2
docker network connect iface5 server2
docker network connect iface6 server2
docker network connect iface7 server2
docker network connect iface8 server2
docker network connect iface9 server2

docker network connect iface2 server3
docker network connect iface3 server3
docker network connect iface4 server3
docker network connect iface5 server3
docker network connect iface6 server3
docker network connect iface7 server3
docker network connect iface8 server3
docker network connect iface9 server3

