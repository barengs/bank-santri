<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $fillable = ['parent_id', 'name', 'icon', 'path', 'sort_order', 'is_divider'];

    protected $appends = ['slug'];

    public function getSlugAttribute()
    {
        return \Illuminate\Support\Str::slug($this->name, '_');
    }

    public function children()
    {
        return $this->hasMany(Menu::class, 'parent_id')->orderBy('sort_order');
    }

    public function parent()
    {
        return $this->belongsTo(Menu::class, 'parent_id');
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_menu');
    }
}

