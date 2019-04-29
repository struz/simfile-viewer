// tslint:disable: no-console

import MsdFile from './MsdFile';
import Steps from './Steps';
import Song from './Song';
import { Helpers, Difficulty } from './GameConstantsAndTypes';
import TimingData from './TimingData';
import NoteHelpers from './NoteTypes';
import { DelaySegment } from './TimingSegments';

// Functions used in function table below to set song data efficiently
type SongTimingInfo = Array<{[key: number]: number}>;
type SongParseFn = (smSongTagInfo: SongTagInfo) => void;

interface SongTagInfo {
    song: Song;
    params: string[];
    bpmChanges: SongTimingInfo;
    stops: SongTimingInfo;
}

function SMSetTitle(smSongTagInfo: SongTagInfo) {
    smSongTagInfo.song.mainTitle = smSongTagInfo.params[1];
}

function SMSetSubtitle(smSongTagInfo: SongTagInfo) {
    smSongTagInfo.song.subTitle = smSongTagInfo.params[1];
}

function SMSetArtist(smSongTagInfo: SongTagInfo) {
    smSongTagInfo.song.artist = smSongTagInfo.params[1];
}

function SMSetTitleTranslit(smSongTagInfo: SongTagInfo) {
    smSongTagInfo.song.mainTitleTranslit = smSongTagInfo.params[1];
}

function SMSetSubtitleTranslit(smSongTagInfo: SongTagInfo) {
    smSongTagInfo.song.subTitleTranslit = smSongTagInfo.params[1];
}

function SMSetArtistTranslit(smSongTagInfo: SongTagInfo) {
    smSongTagInfo.song.artistTranslit = smSongTagInfo.params[1];
}
function SMSetGenre(smSongTagInfo: SongTagInfo) {
    smSongTagInfo.song.genre = smSongTagInfo.params[1];
}
function SMSetCredit(smSongTagInfo: SongTagInfo) {
    smSongTagInfo.song.credit = smSongTagInfo.params[1];
}
function SMSetBanner(smSongTagInfo: SongTagInfo) {
    console.debug('Skipping parsing banner');
}
function SMSetBackground(smSongTagInfo: SongTagInfo) {
    console.debug('Skipping parsing background file');
}
function SMSetLyricsPath(smSongTagInfo: SongTagInfo) {
    console.debug('Skipping parsing lyrics path');
}
function SMSetCDTitle(smSongTagInfo: SongTagInfo) {
    console.debug('Skipping parsing CD title');
}
function SMSetMusic(smSongTagInfo: SongTagInfo) {
    console.debug('Skipping parsing music file');
}
function SMSetOffset(smSongTagInfo: SongTagInfo) {
    smSongTagInfo.song.songTiming.setOffset(parseFloat(smSongTagInfo.params[1]));
}
function SMSetBPMs(smSongTagInfo: SongTagInfo) {
    smSongTagInfo.bpmChanges = NoteLoaderSM.parseBpms(smSongTagInfo.params[1]);
}
function SMSetStops(smSongTagInfo: SongTagInfo) {
    smSongTagInfo.stops = NoteLoaderSM.parseStops(smSongTagInfo.params[1]);
}
function SMSetDelays(smSongTagInfo: SongTagInfo) {
    smSongTagInfo.song.songTiming = NoteLoaderSM.processDelays(smSongTagInfo.params[1]);
}
function SMSetTimeSignatures(smSongTagInfo: SongTagInfo) {
    // info.loader->ProcessTimeSignatures(info.song->m_SongTiming, (*info.params)[1]);
}
function SMSetTickCounts(smSongTagInfo: SongTagInfo) {
    // info.loader->ProcessTickcounts(info.song->m_SongTiming, (*info.params)[1]);
}
function SMSetInstrumentTrack(smSongTagInfo: SongTagInfo) {
    // info.loader->ProcessInstrumentTracks(*info.song, (*info.params)[1]);
}
function SMSetSampleStart(smSongTagInfo: SongTagInfo) {
    // info.song->m_fMusicSampleStartSeconds = HHMMSSToSeconds((*info.params)[1]);
}
function SMSetSampleLength(smSongTagInfo: SongTagInfo) {
    // info.song->m_fMusicSampleLengthSeconds = HHMMSSToSeconds((*info.params)[1]);
}
function SMSetDisplayBPM(smSongTagInfo: SongTagInfo) {
//   // #DISPLAYBPM:[xxx][xxx:xxx]|[*];
//   if((*info.params)[1] == "*")
//   { info.song->m_DisplayBPMType = DISPLAY_BPM_RANDOM; }
//   else
//   {
//     info.song->m_DisplayBPMType = DISPLAY_BPM_SPECIFIED;
//     info.song->m_fSpecifiedBPMMin = StringToFloat((*info.params)[1]);
//     if((*info.params)[2].empty())
//     { info.song->m_fSpecifiedBPMMax = info.song->m_fSpecifiedBPMMin; }
//     else
//     { info.song->m_fSpecifiedBPMMax = StringToFloat((*info.params)[2]); }
//   }
}
function SMSetSelectable(smSongTagInfo: SongTagInfo) {
//   Rage::ci_ascii_string valueName{ (*info.params)[1].c_str() };
//   if (valueName == "YES")
//   { 
//     info.song->m_SelectionDisplay = info.song->SHOW_ALWAYS; 
//   }
//   else if(valueName == "NO")
//   { 
//     info.song->m_SelectionDisplay = info.song->SHOW_NEVER; 
//   }
//   // ROULETTE from 3.9. It was removed since UnlockManager can serve
//   // the same purpose somehow. This, of course, assumes you're using
//   // unlocks. -aj
//   else if(valueName == "ROULETTE")
//   { 
//     info.song->m_SelectionDisplay = info.song->SHOW_ALWAYS; 
//   }
//   /* The following two cases are just fixes to make sure simfiles that
// 	 * used 3.9+ features are not excluded here */
//   else if(valueName == "ES" || valueName == "OMES")
//   { 
//     info.song->m_SelectionDisplay = info.song->SHOW_ALWAYS; 
//   }
//   else if(StringToInt((*info.params)[1]) > 0)
//   {
//     info.song->m_SelectionDisplay = info.song->SHOW_ALWAYS;
//   }
//   else
//   {
//     LOG->UserLog("Song file", info.path, "has an unknown #SELECTABLE value, \"%s\"; ignored.", (*info.params)[1].c_str());
//   }
}
function SMSetBGChanges(smSongTagInfo: SongTagInfo) {
    // info.loader->ProcessBGChanges(*info.song, (*info.params)[0], info.path, (*info.params)[1]);
}
function SMSetFGChanges(smSongTagInfo: SongTagInfo) {
    // auto aFGChangeExpressions = Rage::split((*info.params)[1], ",");

    // for (auto &expression: aFGChangeExpressions)
    // {
    //     BackgroundChange change;
    //     if(info.loader->LoadFromBGChangesString(change, expression))
    //     info.song->AddForegroundChange(change);
    // }
}
function SMSetKeysounds(smSongTagInfo: SongTagInfo) {
    // // Do not assume it's empty.
    // auto toDump = Rage::split((*info.params)[1], ",");
    // auto &soundFiles = info.song->m_vsKeysoundFile;
    // soundFiles.insert(soundFiles.end(), std::make_move_iterator(toDump.begin()), std::make_move_iterator(toDump.end()));
}
function SMSetAttacks(smSongTagInfo: SongTagInfo) {
    // info.loader->ProcessAttackString(info.song->m_sAttackString, (*info.params));
    // info.loader->ProcessAttacks(info.song->m_Attacks, (*info.params));
}

// Function table for setting song data efficiently
const parserHelper: Map<string, SongParseFn> = new Map([
    ['TITLE', SMSetTitle],
    ['SUBTITLE', SMSetSubtitle],
    ['ARTIST', SMSetArtist],
    ['TITLETRANSLIT', SMSetTitleTranslit],
    ['SUBTITLETRANSLIT', SMSetSubtitleTranslit],
    ['ARTISTTRANSLIT', SMSetArtistTranslit],
    ['GENRE', SMSetGenre],
    ['CREDIT', SMSetCredit],
    ['BANNER', SMSetBanner],
    ['BACKGROUND', SMSetBackground],
    // Save "#LYRICS" for later, so we can add an internal lyrics tag.
    ['LYRICSPATH', SMSetLyricsPath],
    ['CDTITLE', SMSetCDTitle],
    ['MUSIC', SMSetMusic],
    ['OFFSET', SMSetOffset],
    ['BPMS', SMSetBPMs],
    ['STOPS', SMSetStops],
    ['FREEZES', SMSetStops],
    ['DELAYS', SMSetDelays],
    ['TIMESIGNATURES', SMSetTimeSignatures],
    ['TICKCOUNTS', SMSetTickCounts],
    ['INSTRUMENTTRACK', SMSetInstrumentTrack],
    ['SAMPLESTART', SMSetSampleStart],
    ['SAMPLELENGTH', SMSetSampleLength],
    ['DISPLAYBPM', SMSetDisplayBPM],
    ['SELECTABLE', SMSetSelectable],
    // It's a bit odd to have the tag that exists for backwards compatibility
    // in this list and not the replacement, but the BGCHANGES tag has a
    // number on the end, allowing up to NUM_BackgroundLayer tags, so it
    // can't fit in the map. -Kyz
    ['ANIMATIONS', SMSetBGChanges],
    ['FGCHANGES', SMSetFGChanges],
    ['KEYSOUNDS', SMSetKeysounds],
    // Attacks loaded from file
    ['ATTACKS', SMSetAttacks],
    /* Tags that no longer exist, listed for posterity.  May their names
        * never be forgotten for their service to Stepmania. -Kyz
        * LASTBEATHINT: // unable to identify at this point: ignore
        * MUSICBYTES: // ignore
        * FIRSTBEAT: // cache tags from older SM files: ignore.
        * LASTBEAT: // cache tags from older SM files: ignore.
        * SONGFILENAME: // cache tags from older SM files: ignore.
        * HASMUSIC: // cache tags from older SM files: ignore.
        * HASBANNER: // cache tags from older SM files: ignore.
        * SAMPLEPATH: // SamplePath was used when the song has a separate preview clip. -aj
        * LEADTRACK: // XXX: Does anyone know what LEADTRACK is for? -Wolfman2000
        * MUSICLENGTH: // Loaded from the cache now. -Kyz
        */
]);

// Reads a song from a .sm file
export class NoteLoaderSM {
    public static parseBpms(line: string, rowsPerBeat: number = -1): SongTimingInfo {
        const songBpmInfo = [];

        const bpmChangeExpressions = line.split(',');
        for (const expression of bpmChangeExpressions) {
            const arrayBpmChangeValues = expression.split('=');
            if (arrayBpmChangeValues.length !== 2) {
                console.error(`.sm data has invalid #BPMs value "${expression}" (must have exactly one "="), ignored`);
                continue;
            }

            const beat = this.rowToBeat(arrayBpmChangeValues[0], rowsPerBeat);
            const newBpm = parseFloat(arrayBpmChangeValues[1]);
            if (newBpm === 0) {
                console.error(`.sm file has a 0 BPM; ignored`);
                continue;
            }
            songBpmInfo.push([beat, newBpm]);
        }
        return songBpmInfo;
    }

    /**
     * Parse Stops data from a string.
     * @param line the string in question.
     * @param rowsPerBeat the number of rows per beat for this purpose.
     */
    public static parseStops(line: string, rowsPerBeat: number = -1): SongTimingInfo {
        const songStopInfo = [];

        const arrayFreezeExpressions = line.split(',');
        for (const expression of arrayFreezeExpressions) {
            const arrayFreezeValues = expression.split('=');
            if (arrayFreezeValues.length !== 2) {
                console.error(`.sm data has invalid #STOPS value "${expression}" (must have exactly one "="), ignored`);
                continue;
            }

            const freezeBeat = this.rowToBeat(arrayFreezeValues[0], rowsPerBeat);
            const freezeSeconds = parseFloat(arrayFreezeValues[1]);
            if (freezeSeconds === 0) {
                console.error(`.sm file has a zero-length stop; ignored`);
                continue;
            }
            songStopInfo.push([freezeBeat, freezeSeconds]);
        }
        return songStopInfo;
    }

    /**
     * Process the Delay Segments from the string.
     * @param line the string in question.
     * @param rowsPerBeat the number of rows per beat for this purpose.
     */
    public static processDelays(line: string, rowsPerBeat: number = -1): TimingData {
        const timingData = new TimingData();

        const arrayDelayExpressions = line.split(',');
        for (const expression of arrayDelayExpressions) {
            const arrayDelayValues = expression.split('=');
            if (arrayDelayValues.length !== 2) {
// tslint:disable-next-line: max-line-length
                console.error(`.sm data has invalid #DELAYS value "${expression}" (must have exactly one "="), ignored`);
                continue;
            }

            const freezeBeat = this.rowToBeat(arrayDelayValues[0], rowsPerBeat);
            const freezeSeconds = parseFloat(arrayDelayValues[1]);
            if (freezeSeconds <= 0) {
                console.error(`.sm file has an invalid dealy at beat ${freezeBeat}, length ${freezeSeconds}}; ignored`);
                continue;
            }
            timingData.addSegment(new DelaySegment(NoteHelpers.beatToNoteRow(freezeBeat), freezeSeconds));
        }
        return timingData;
    }

    /**
     * Convert a row value to the proper beat value.
     * This is primarily used for assistance with converting SMA files.
     * @param line The line that contains the value.
     * @param rowsPerBeat the number of rows per beat according to the original file.
     * @return the converted beat value.
     */
    public static rowToBeat(line: string, rowsPerBeat: number) {
        // Trim r and R characters from the sides of the string
// tslint:disable-next-line: max-line-length
        // Modifies .trim() polyfill at https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim
        const backup = line.replace(/^[rR]+|[rR]+$/g, '');
        // If r or R were present, there's multiple rows per beat
        if (backup !== line) {
            return parseFloat(line) / rowsPerBeat;
        }
        return parseFloat(line);
    }

    public static loadFromSimfile(msdFile: MsdFile): Song {
        const song = new Song();
        for (let i = 0; i < msdFile.getNumValues(); i++) {
            const numParams = msdFile.getNumParams(i);
            const params = msdFile.getValue(i);
            const valueName = params[0].toUpperCase();
            // TODO: based on tag name, do something different to parse it
            // In StepMania they use a map of functions?
            // TODO: what is the difference betwen NotesLoaderSM::LoadFromSimfile and ::LoadNotesFromSimfile?
            // - LoadFromSimfile produces a Song

            // TODO: parse all the things they have a function for in StepMania *sigh*
            // TODO: parse BGCHANGES.* (or not)
            if (valueName === 'NOTES' || valueName === 'NOTES2') {
                if (numParams < 7) {
                    throw new Error(`.sm file has ${numParams} fields in a #NOTES tag, but should have at least 7.`);
                }

                const steps = this.loadFromTokens(
                    params[1],
                    params[2],
                    params[3],
                    params[4],
                    params[6],
                );
                song.addSteps(steps);
            }
        }
        if (!song.hasSteps()) {
            throw new Error('did not find step data for song');
        }
        return song;
    }

    public static loadNoteDataFromSimfile(msdFile: MsdFile): Steps {
        for (let i = 0; i < msdFile.getNumValues(); i++) {
            const numParams = msdFile.getNumParams(i);
            const params = msdFile.getValue(i);
            const valueName = params[0].toUpperCase();

            // The only tag we care about is the #NOTES tag.
            if (valueName === 'NOTES' || valueName === 'NOTES2') {
                if (numParams < 7) {
                    throw new Error(`.sm file has ${numParams} fields in a #NOTES tag, but should have at least 7.`);
                }

                const stepsType: string = params[1].trim();
                const description: string = params[2].trim();
                let difficulty: string = params[3].trim();

                // Hack - if this is a .edit file, fudge the difficulty
                // TODO: we have no way to know this given the data pasted in, 
                // but StepMania does it by the .edit extension

                // Old version difficulty changes
                if (difficulty === 'smaniac') {
                    difficulty = 'Challenge';
                }
                if (difficulty === 'hard') {
                    if (description === 'smaniac' || description === 'challenge') {
                        difficulty = 'Challenge';
                    }
                }

                // TODO: something with setting the step type
                const noteData: string = params[6].trim();
                const steps = new Steps(noteData);

                // this.steps.SetSMNoteData(noteData) // Handles compressed data initialisation - note data is lazily loaded from this
                // this.steps.TidyUpData() // Handles invalid difficulties and other stuff
                return steps;
            }
        }
        throw new Error('could not find note data');
    }

    public static loadFromTokens(
        stepsType: string,
        description: string,
        difficulty: string,
        meter: string,
        noteData: string,
    ): Steps {
        const steps = new Steps(noteData);

        // Backwards compatibility hacks
        switch (stepsType) {
            case 'ez2-single-hard':
                stepsType = 'ez2-single';
                break;
            case 'para':
                stepsType = 'para-single';
                break;
        }

        // TODO: string to steps type
        steps.stepsType = Helpers.StringToStepsType(stepsType);
        steps.stepsTypeName = stepsType;
        steps.description = description;
        steps.credit = description; // This is often used for both
        steps.chartName = description; // One more for good measure
        steps.difficulty = Helpers.oldStyleStringToDifficulty(difficulty);

        // Handle hacks that originated back when StepMania didn't have
        // Difficulty_Challenge. (At least v1.64, possibly v3.0 final...)
        if (steps.difficulty === Difficulty.Hard) {
            if (description === 'smaniac' || description === 'challenge') {
                steps.difficulty = Difficulty.Challenge;
            }
        }
        if (steps.difficulty === Difficulty.Invalid) {
            steps.difficulty = Difficulty.Edit;
        }
        if (meter.length === 0) {
            meter = '1';
        }
        steps.meter = parseInt(meter, 10);

        return steps;
    }
}
export default NoteLoaderSM;
