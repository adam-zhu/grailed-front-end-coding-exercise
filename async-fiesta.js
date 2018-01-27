$(() => {
  const $bucket = $('.photo-bucket');
  const draw = img => $bucket.append(img);

  // NOTE: The height and width variables can be changed to fetch different sized images.
  const getImageUrl = id => `https://process.fs.grailed.com/AJdAgnqCST4iPtnUxiGtTz/cache=expiry:max/rotate=deg:exif/rotate=deg:0/resize=width:30,height:30,fit:crop/output=format:jpg,quality:95/compress/${id}`;

  // if arr.length not divisible by chunk_size last chunk will contain the remainder
  const chunkify = chunk_size => arr => {
    if (arr.length < chunk_size) {
      return [ arr ];
    }

    return [ arr.slice(0, chunk_size) ].concat(chunkify(chunk_size)(arr.slice(chunk_size, arr.length)));
  };

  const get_img_url_chunk = chunk => chunk.map(getImageUrl);

  const promisify_chunk = url_chunk => {
    return url_chunk.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`${url} failed`));
      });
    });
  };

  const load_chunk = chunk => Promise.all(promisify_chunk(chunk));
  const draw_chunk = chunk => chunk.map(draw);

  const id_chunks = chunkify(5)(IMAGE_IDS);
  const url_chunks = id_chunks.map(get_img_url_chunk);

  let stopped = false;
  let timer;

  const startLoading = () => {
    console.log('Start!'); // this console.log is now slightly a lie

    stopped = false;

    timer = window.setTimeout(() => {
      if (stopped === false) {
        if (url_chunks.length > 0) {
          const url_chunk = url_chunks.shift(); // mutates url_chunks (if you successed and want to start again tough titties)

          load_chunk(url_chunk)
            .then(draw_chunk)
            .then(() => {
              if (stopped === false) {
                startLoading();
              }
              else {
                window.clearTimeout(timer);
              }
            })
            .catch(e => {
              console.error(e);
              draw(e.toString());

              if (stopped === false && url_chunks.length > 0) {
                startLoading();
              }
            });
        }
        else {
          console.log("success");
        }
      }
    }, 1);
  };

  const stopLoading = () => {
    console.log('Stop!');

    stopped = true;
  };

  $('button.start').on('click', startLoading);
  $('button.stop').on('click', stopLoading);

});
