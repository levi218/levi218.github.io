---
title: Automatic subtitles on a Synology NAS with Subliminal, no Bazarr needed
date: 2026-11-09
summary: A 30-line script and a scheduled task download subtitles for every video on the NAS, without Sonarr or Radarr.
---
*About a 6-minute read*

My setup is simple: movies get downloaded into one folder on the NAS, and Plex serves them to my phone and TV. Plex already handles the metadata, the posters and the library indexing. The one thing missing was subtitles. I wanted every new movie in that folder to get them automatically.

[Bazarr](https://www.bazarr.media/) is the usual answer, but it only knows about the videos that Sonarr and Radarr tell it about. To use it, I would have to set up the whole *arr stack: Sonarr, Radarr, maybe Prowlarr, each with its own database, web interface and settings. Most of that would just repeat the indexing Plex already does. Running all of it only to get subtitles is far too much.

[Subliminal](https://github.com/Diaoul/subliminal) is the library underneath: Bazarr itself grew out of a patched fork of it. On its own it is a command-line tool that takes a list of video files, searches several subtitle sites, scores the results against each file name and saves the best match next to the video. That is all we need. This post sets it up on a Synology NAS with one shell script and DSM's built-in Task Scheduler.

## What you need

- A Synology NAS running DSM 7.2 or later.
- **Container Manager** installed from Package Center. We use it to run Subliminal inside a throwaway Python container, so nothing is installed on the NAS itself.
- A shared folder for the script. Mine is called `docker`; any folder works.
- Optional but recommended: a free [OpenSubtitles.com](https://www.opensubtitles.com/) account. It is the biggest provider, and it only allows downloads when you sign in.

## Step 1: Save the script

Create a file called `subtitle-search.sh` in your shared folder (for example with File Station, or from your computer over SMB), and paste this in:

```sh
#!/bin/sh
# Download missing subtitles and save them next to each video.
# Schedule with DSM Task Scheduler as root.

MEDIA="${MEDIA:-/volume1/Downloads}"
LANGUAGES="en vi"
MIN_SCORE=50 # 0-100. Lower finds more, but risks subtitles for the wrong movie.

# Optional. OpenSubtitles needs a free account for downloads.
OPENSUBTITLES_USERNAME=""
OPENSUBTITLES_PASSWORD=""

export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

LANGUAGE_FLAGS=""
for language in $LANGUAGES; do LANGUAGE_FLAGS="$LANGUAGE_FLAGS -l $language"; done

# --name doubles as a lock: Docker refuses to start while the previous run is going.
# Only sidecars count as "has subtitles": Plex may not show embedded tracks, and
# tracks with an unknown language block downloads for the other languages.
exec docker run --rm --name subtitle-search \
  -v "$MEDIA":/media \
  -e SUBLIMINAL_PROVIDER_OPENSUBTITLESCOM_USERNAME="$OPENSUBTITLES_USERNAME" \
  -e SUBLIMINAL_PROVIDER_OPENSUBTITLESCOM_PASSWORD="$OPENSUBTITLES_PASSWORD" \
  -e LANGUAGE_FLAGS="$LANGUAGE_FLAGS" -e MIN_SCORE="$MIN_SCORE" \
  python:3.12-slim sh -c '
    pip install -q --root-user-action=ignore --disable-pip-version-check subliminal==2.6.0 || exit 1
    find /media \( -name "#recycle" -o -name "@eaDir" -o -name ".*" \) -prune -o -type f \
      \( -iname "*.mkv" -o -iname "*.mp4" -o -iname "*.avi" -o -iname "*.m4v" -o -iname "*.mov" -o -iname "*.wmv" -o -iname "*.ts" \) -print0 |
      xargs -0 -r subliminal --cache-dir /media/.subtitle-search download \
        $LANGUAGE_FLAGS --min-score "$MIN_SCORE" --force-embedded-subtitles -v
  '
```

If you edit it on Windows, make sure the file is saved with Unix (LF) line endings, or `sh` will trip over the invisible `\r` characters.

## Step 2: Fill in your settings

Only the block at the top needs changing:

- **`MEDIA`** is the folder to scan, as the NAS sees it. Shared folders live under `/volume1/<name>` (or `/volume2`, depending on which volume they are on). Every subfolder is scanned too, so pointing it at your library root is enough.
- **`LANGUAGES`** is a space-separated list of two-letter language codes. I use English and Vietnamese; each video gets one subtitle per language, saved as `Movie.en.srt`, `Movie.vi.srt` and so on — the names Plex, Jellyfin and Emby all pick up automatically.
- **`MIN_SCORE`** decides how sure Subliminal must be before it downloads. It compares the file name (title, year, season, episode, release group, resolution) against each candidate subtitle. 50 is a reasonable start; raise it if you get subtitles that drift out of sync, lower it if too many videos come back empty.
- **`OPENSUBTITLES_USERNAME` / `PASSWORD`** are your OpenSubtitles.com login. Leave them empty to use only the providers that need no account.

Because the script now holds a password, keep it readable only by administrators: in File Station, right-click the file, choose **Properties → Permission**, and remove access for everyone else.

## Step 3: Schedule it

Everything from here happens in the DSM web interface; no SSH needed.

1. Open **Control Panel → Task Scheduler**.
2. Choose **Create → Scheduled Task → User-defined script**.
3. On **General**, name it `Subtitle search` and set **User** to `root`. Docker on DSM needs root.
4. On **Schedule**, pick **Run on the following days: Daily** and a quiet hour, say 3:00 AM. If new videos arrive often, you can repeat it every few hours instead.
5. On **Task Settings**, enter the command:

   ```sh
   sh /volume1/docker/subtitle-search.sh
   ```

   Under **Notification**, you can also tick **Send run details by email** and **only when the script terminates abnormally**, to hear about failures.
6. Click **OK**.

## Step 4: Run it once and check

Don't wait until 3 AM to find out whether it works:

1. In Task Scheduler, select the task and click **Run**. Confirm the prompt.
2. The first run downloads the `python:3.12-slim` image and installs Subliminal, which takes a minute or two, then searches every video. While it runs you can see a container called `subtitle-search` under **Container Manager → Container**; it disappears when the run is done.
3. Back in Task Scheduler, select the task and choose **Action → View Result**. The status should be *Normal (0)*, and the output shows each video being searched and how many subtitles were downloaded.
4. Open a video folder in File Station: the new `.srt` files sit right next to the videos.

If **View Result** is greyed out, turn on output logging first: in Task Scheduler click **Settings**, tick **Save output results**, pick a folder, and run the task again.

That is it. From now on every new video in the folder gets subtitles within a day, however it got there.

## How the script works

A few details are worth explaining, because they are what make it safe to run unattended:

- **Nothing is installed on the NAS.** Each run starts a fresh `python:3.12-slim` container, installs a pinned Subliminal version inside it, and the container is deleted when it finishes (`--rm`). DSM updates cannot break it, and removing it means deleting one file.
- **It never overlaps itself.** The container always has the same `--name`, and Docker refuses to start a second container with a name that is taken. If last night's run on a huge library is still going, tonight's simply fails to start instead of doubling the work.
- **It skips what is already done.** Subliminal looks for existing sidecar files like `Movie.en.srt` and only searches for the languages that are missing. After the first run, a nightly pass over a large library is quick, and the cache folder (`.subtitle-search` inside your media folder) remembers what the providers returned so they are not asked again and again.
- **It ignores embedded subtitles on purpose.** `--force-embedded-subtitles` tells Subliminal not to count subtitle tracks inside the video file. Players do not always show those, and a track with no language tag would otherwise stop Subliminal from fetching any language at all.
- **It stays out of Synology's system folders.** The `find` command skips `#recycle` (the recycle bin), `@eaDir` (thumbnail indexes) and hidden folders, so it does not download subtitles for deleted files or thumbnails.

## When it does not find anything

- **Check the file names.** Subliminal works out what a video is from its name. `The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv` matches easily; `movie_final(2).mkv` does not. Renaming to `Title (Year)` helps a lot.
- **Add your OpenSubtitles login** if you left it empty. Without it, many popular titles have no match.
- **Lower `MIN_SCORE`** to around 30 for older or obscure films, and accept that you may need to delete the odd wrong subtitle by hand.
- **Read the log** with **Action → View Result** in Task Scheduler. Provider errors, such as a wrong password or a daily download limit, show up there.

## Bazarr or this?

If you already run Sonarr and Radarr, Bazarr is the better tool: it has a web interface, upgrades subtitles over time and lets you search for one episode by hand. If you do not, this script gives you most of the value — every video gets subtitles in your languages, automatically — with no services to keep running, no database and no web interface to secure. It is one file you can read top to bottom in a minute.
