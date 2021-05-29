import cheerio from 'cheerio';
const rootUrl = 'https://www.infoconcert.com/ville/chambery-1386/concerts.html';
import { v4 as uuidv4 } from 'uuid';
import { getArtistTopTrackUri } from './spotifyService';
import getImageFromGoogle from './googleService';
import signale from 'signale';
import fetch from 'node-fetch';
import { capitalizeFirstLetter } from '../lib/helpers';

const saveInfoConcertsConcerts = async () => {
  let isCanceled = false;
  const urlsDescription = [];

  const html = await fetch(rootUrl);
  const $ = cheerio.load(html.data);
  const concerts = [];
  const artists = [];

  // On choppe les cartes qui ont pour startdate la date d'aujourd'hui
  $('.panel-body').each((index, element) => {
    $(element)
      .find('div.row')
      .find('div.date')
      .find('time')
      .filter(function () {
        if ($(element).find('span.btn_annul').text().length > 0) {
          isCanceled = true;
        }
        const id = uuidv4();
        const startDate = getDate($(this).attr('datetime'));
        const artist = $(element).find('div.row').find('div.summary').find('a').html();
        artists.push(capitalizeFirstLetter(artist));

        const venue = $(element)
          .find('div.row')
          .find('div.summary')
          .find('div.location')
          .find('span')
          .html()
          .replace('A Chambery', '')
          .trim();

        const price = $(element).find('div.price').text().trim();
        const urlDescription =
          'https://www.infoconcert.com/' + $(element).find('div.spectacle > a').attr('href');
        urlsDescription.push({
          id,
          url: urlDescription,
        });

        concerts.push({
          id,
          startDate,
          artist: {
            name: capitalizeFirstLetter(artist),
          },
          venue: {
            name: venue,
          },
          isCanceled,
          price,
          urlDescription,
        });
        isCanceled = false;
      });
  });

  const getDescription = async () => {
    for (const urlD of urlsDescription) {
      const { id, url } = urlD;
      const concertToEdit = concerts.find((c) => c.id === id);
      const html = await fetch(url);
      const $ = cheerio.load(html.data);
      if ($('p.resume')) {
        const description = $('p.resume').text();
        concertToEdit['description'] = description;
      } else {
        const description = $('div[style="text-align: justify;"]').text();
        concertToEdit['description'] = description;
      }
      // const image = $('img').html();
    }
  };
  await getDescription();

  const getUris = async () => {
    for (const artist of artists) {
      const uri = await getArtistTopTrackUri(artist);
      const concertToEdit = concerts.find(({ artist: { name } }) => name === artist);
      concertToEdit.artist.spotifyTopTrackUri = uri;
    }
  };

  await getUris();
  return concerts;
};
//commentaire ici
const getDate = (elem) => {
  const raw = elem.trim().replace(/-/g, '');
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  const hour = raw.slice(9, 11);
  const minute = raw.slice(12, 14);
  return DateTime.fromObject({
    day,
    month,
    year,
    hour,
    minute,
    zone: 'Europe/Paris',
  });
};

export async function saveICToBdd() {
  signale.info("Fetch des concerts d'info concert en cours...");
  let count = 0;
  let concerts = [];
  try {
    concerts = await saveInfoConcertsConcerts();
  } catch (error) {
    signale.error('IC fetch error', error);
  }

  for (const concert of concerts) {
    const newConcert = new Concert(concert);
    const exists = await _exists({
      startDate: newConcert.startDate,
      'artist.name': newConcert.artist.name,
    });
    if (!exists) {
      count = count + 1;
      if (!newConcert.largePicture) {
        newConcert.largePicture = await getImageFromGoogle(newConcert.artist.name);
      }
      newConcert
        .save()
        .then(() => signale.info(`concert de ${concert?.artist?.name} enregistré! `));
    } else {
      signale.info(`concert de ${concert?.artist?.name} NON enregistré car déjà présent `);
    }
  }
  signale.success("Fetch des concerts d'info concert terminé !");
  signale.success(`${count} concerts d'IC ajoutés`);
  return count;
}
