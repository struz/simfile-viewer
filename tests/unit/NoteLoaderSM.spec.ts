import { expect } from 'chai';
import NoteLoaderSM from '@/lib/NoteLoaderSM';
import fs from 'fs';
import { DisplayBPM } from '@/lib/Steps';
import MsdFile from '@/lib/MsdFile';

describe('NoteLoaderSM', () => {
    let bigSkySmFile = '';

    before('load .sm file', (done) => {
        fs.readFile('tests/fixtures/BigSky.sm', 'utf8', (err, data) => {
            if (err) {
                throw err;
            }
            bigSkySmFile = data;
            done();
        });
    });

    it('parses BigSky correctly', () => {
        const msdFile = new MsdFile(bigSkySmFile);
        const song = NoteLoaderSM.loadFromSimfile(msdFile);

        expect(song.mainTitle, 'mainTitle').to.equal('Big Sky');
        expect(song.subTitle, 'subTitle').to.equal('(Agnelli & Nelson Remix)');
        expect(song.artist, 'artist').to.equal('John O\'Callaghan');
        expect(song.mainTitleTranslit, 'mainTitleTranslit').to.equal('');
        expect(song.subTitleTranslit, 'subTitleTranslit').to.equal('');
        expect(song.artistTranslit, 'artistTranslit').to.equal('');
        expect(song.genre, 'genre').to.equal('');
        expect(song.credit, 'credit').to.equal('t0ni');
        // We don't parse #BANNER
        // We don't parse #BACKGROUND
        // We don't parse #LYRICSPATH
        // We don't parse #CDTITLE
        // We don't parse #MUSIC

        // TODO: make sure this offset is right for charts with wack stuff before the first beat
        expect(song.songTiming.getOffset(), 'offset').to.equal(-0.068);
        expect(song.musicSampleStartSec, 'musicSampleStartSec').to.equal(178.794);
        expect(song.musicSampleLengthSec, 'musicSampleLength').to.equal(24);
        // We don't parse #SELECTABLE
        // TODO: for BPMs test all the different display types properly
        // 'Big Sky' doesn't have a #SPECIFIEDBPM tag so it uses ACTUAL
        expect(song.specifiedBpmMin, 'specifiedBpmMin').to.equal(0);
        expect(song.specifiedBpmMax, 'specifiedBpmMax').to.equal(0);
        expect(song.displayBpmType, 'bpmType').to.equal(DisplayBPM.ACTUAL);

        // TODO: check stops properly
        // We don't parse #BGCHANGES
        // We don't parse #KEYSOUNDS

        // TODO: check notes properly
    });

    // TODO: craft a special simfile that has all the kinds of fields, including stops and BPM changes
});
