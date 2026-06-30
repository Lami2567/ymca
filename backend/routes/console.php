<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('about-api', function () {
    $this->info(config('app.name').' API');
})->purpose('Display basic API information');
