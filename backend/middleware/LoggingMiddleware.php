<?php

class LoggingMiddleware {
    public function logRequest() {
        $request = Flight::request();

        $logData = [
            'time'       => date('Y-m-d H:i:s'),
            'method'     => $request->method,
            'url'        => $request->url,
            'query'      => $request->query,
            'body'       => $request->data->getData(),
            'ip'         => $request->ip,
            'user_agent' => $request->user_agent,
            'referrer'   => $request->referrer,
            'scheme'     => $request->scheme,
            'ajax'       => $request->ajax,
            'host'       => $request->host
        ];

        $logMessage = json_encode($logData) . "\n";
        file_put_contents(__DIR__ . '/../logs/logs.txt', $logMessage, FILE_APPEND);
    }
}