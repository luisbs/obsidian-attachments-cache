# Caching Examples

To test this examples:

1. Ensure the `Remotes List` setting is the next one.

```txt
w github.com/elementary/wallpapers
b *
```

2. Delete the folder `__cache` if it is present.
3. Open this note on _Read View_ to make it load the images.

---

## Standard Cache Rules

### Whitelisted URL

The next example is cached based on the `Remotes List`.

> Remote
> ![](https://github.com/elementary/wallpapers/blob/main/backgrounds/A%20Large%20Body%20of%20Water%20Surrounded%20By%20Mountains.jpg?raw=true)

> Local Cache (should be present)
> ![[A_20Large_20Body_20of_20Water_20Surrounded_20By_20Mountains.jpg]]

---

### Blacklisted URL

The next example is ignored based on the `Remotes List`.

> Remote
> ![](https://my.alfred.edu/zoom/_images/foster-lake.jpg)

> Local Cache (should be missing)
> ![[foster-lake.jpg]]

---

## Per-file Overrides

### Blacklisted URL uses _URL Param Cache_

The next example is cached base on URL param `cache_file`.

> Remote
> ![](https://wallpaperaccess.com/full/2130189.jpg?cache_file)

> Local Cache (should be present)
> ![[2130189.jpg]]

---

### Whitelisted URL uses _URL Param Ignore_

The next example is ignored base on URL param `ignore_file`.

> Remote
> ![](https://github.com/elementary/wallpapers/blob/main/backgrounds/A%20Trail%20of%20Footprints%20In%20The%20Sand.jpg?raw=true&ignore_file)

> Local Cache (should be missing)
> ![[A_20Trail_20of_20Footprints_20In_20The_20Sand.jpg]]

---

<!--
### Other case

> Remote
> ![](https://github.com/elementary/wallpapers/blob/main/backgrounds/Ashim%20DSilva.jpg?raw=true)

> Local Cache (should be present)
> ![[Ashim_20DSilva.jpg]]
-->
