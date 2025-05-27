/*=== Javascript function indexing hear===========

1.counterUp ----------(Its use for counting number)
2.stickyHeader -------(header class sticky)
3.wowActive ----------( Waw js plugins activation)
4.swiperJs -----------(All swiper in this website hear)
5.salActive ----------(Sal animation for card and all text)
6.textChanger --------(Text flip for banner section)
7.timeLine -----------(History Time line)
8.datePicker ---------(On click date calender)
9.timePicker ---------(On click time picker)
10.timeLineStory -----(History page time line)
11.vedioActivation----(Vedio activation)
12.searchOption ------(search open)
13.cartBarshow -------(Cart sode bar)
14.sideMenu ----------(Open side menu for desktop)
15.Back to top -------(back to top)
16.filterPrice -------(Price filtering)

==================================================*/

(function ($) {
  'use strict';

  var rtsJs = {
    m: function (e) {
      rtsJs.d();
      rtsJs.methods();
    },
    d: function (e) {
      this._window = $(window),
        this._document = $(document),
        this._body = $('body'),
        this._html = $('html')
    },
    methods: function (e) {
      // rtsJs.preloader();
      rtsJs.countDown();
      rtsJs.filterPrice();
      rtsJs.galleryPopUp();
      rtsJs.galleryPopUpmag();
      rtsJs.timeLineStory();
      rtsJs.vedioActivation();
      rtsJs.odoMeter();
      rtsJs.searchOption();
      rtsJs.metismenu();
      rtsJs.swiperActive();
      rtsJs.wowActive();
      rtsJs.stickyHeader();
      rtsJs.backToTopInit();
      rtsJs.sideMenu();
      rtsJs.menuCurrentLink();
      rtsJs.imageSwipe();
      rtsJs.niceSelect();
      rtsJs.portfolioHOver();
      rtsJs.cartBarshow();
      rtsJs.smoothScroll();
      rtsJs.rtlToggle();
    },
    // preloader: function () {

    //   var preload = $("#elevate-load");

    //   if (preload.length) {
    //     window.addEventListener('load', function () {
    //       document.querySelector('#elevate-load').classList.add("loaded");
    //     });
    //   };

    // },
    smoothScroll: function (e) {
      $(document).on('click', '.onepage a[href^="#"]', function (event) {
        event.preventDefault();

        $('html, body').animate({
          scrollTop: $($.attr(this, 'href')).offset().top
        }, 2000);
      });
    },
    countDown: function () {

      let countDown = document.getElementsByClassName('countdown');
      if (countDown.length) {
        document.addEventListener("DOMContentLoaded", function () {
          // Get the countdown element and the end date from its attribute
          const countdownElement = document.getElementById("countdown");
          const endDate = countdownElement.getAttribute("data-end-date");
          const endTime = new Date(endDate).getTime();

          if (isNaN(endTime)) {
            document.querySelector(".timer-section").innerHTML = "Invalid end date!";
            return;
          }

          // Get references to the time unit elements
          const daysElement = document.getElementById("days");
          const hoursElement = document.getElementById("hours");
          const minutesElement = document.getElementById("minutes");
          const secondsElement = document.getElementById("seconds");

          // Update the countdown every second
          const countdownInterval = setInterval(() => {
            const currentTime = new Date().getTime();
            const timeDifference = endTime - currentTime;

            // Calculate days, hours, minutes, and seconds
            const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
            const hours = Math.floor(
              (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            const minutes = Math.floor(
              (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
            );
            const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

            // Update the timer elements
            if (timeDifference > 0) {
              daysElement.textContent = days;
              hoursElement.textContent = hours;
              minutesElement.textContent = minutes;
              secondsElement.textContent = seconds;
            } else {
              // Clear the interval and display "Time's up" when countdown ends
              clearInterval(countdownInterval);
              document.querySelector(".timer-section").innerHTML = "Time's up!";
            }
          }, 1000);
        });
      }
    },
    filterPrice: function () {
      var filter_price = $('.filter-price');
      if (filter_price.length) {
        var lowerSlider = document.querySelector('#lower');
        var upperSlider = document.querySelector('#upper');

        document.querySelector('#two').value = upperSlider.value;
        document.querySelector('#one').value = lowerSlider.value;

        var lowerVal = parseInt(lowerSlider.value);
        var upperVal = parseInt(upperSlider.value);

        upperSlider.oninput = function () {
          lowerVal = parseInt(lowerSlider.value);
          upperVal = parseInt(upperSlider.value);

          if (upperVal < lowerVal + 4) {
            lowerSlider.value = upperVal - 4;
            if (lowerVal == lowerSlider.min) {
              upperSlider.value = 4;
            }
          }
          document.querySelector('#two').value = this.value
        };

        lowerSlider.oninput = function () {
          lowerVal = parseInt(lowerSlider.value);
          upperVal = parseInt(upperSlider.value);
          if (lowerVal > upperVal - 4) {
            upperSlider.value = lowerVal + 4;
            if (upperVal == upperSlider.max) {
              lowerSlider.value = parseInt(upperSlider.max) - 4;
            }
          }
          document.querySelector('#one').value = this.value
        };
      }
    },
    galleryPopUp: function (e) {
      // Gallery image hover
      $(".img-wrapper").hover(
        function () {
          $(this).find(".img-overlay").animate({ opacity: 1 }, 600);
        }, function () {
          $(this).find(".img-overlay").animate({ opacity: 0 }, 600);
        }
      );

      // Lightbox
      var $overlay = $('<div id="overlay"></div>');
      var $image = $("<img>");
      var $prevButton = $('<div id="prevButton"><i class="fa fa-chevron-left"></i></div>');
      var $nextButton = $('<div id="nextButton"><i class="fa fa-chevron-right"></i></div>');
      var $exitButton = $('<div id="exitButton"><i class="fa fa-times"></i></div>');

      // Add overlay
      $overlay.append($image).prepend($prevButton).append($nextButton).append($exitButton);
      $("#gallery").append($overlay);

      // Hide overlay on default
      $overlay.hide();

      // When an image is clicked
      $(".img-overlay").click(function (event) {
        // Prevents default behavior
        event.preventDefault();
        // Adds href attribute to variable
        var imageLocation = $(this).prev().attr("href");
        // Add the image src to $image
        $image.attr("src", imageLocation);
        // Fade in the overlay
        $overlay.fadeIn("slow");
      });

      // When the overlay is clicked
      $overlay.click(function () {
        // Fade out the overlay
        $(this).fadeOut("slow");
      });

      // When next button is clicked
      $nextButton.click(function (event) {
        // Hide the current image
        $("#overlay img").hide();
        // Overlay image location
        var $currentImgSrc = $("#overlay img").attr("src");
        // Image with matching location of the overlay image
        var $currentImg = $('#image-gallery img[src="' + $currentImgSrc + '"]');
        // Finds the next image
        var $nextImg = $($currentImg.closest(".image").next().find("img"));
        // All of the images in the gallery
        var $images = $("#image-gallery img");
        // If there is a next image
        if ($nextImg.length > 0) {
          // Fade in the next image
          $("#overlay img").attr("src", $nextImg.attr("src")).fadeIn(800);
        } else {
          // Otherwise fade in the first image
          $("#overlay img").attr("src", $($images[0]).attr("src")).fadeIn(800);
        }
        // Prevents overlay from being hidden
        event.stopPropagation();
      });

      // When previous button is clicked
      $prevButton.click(function (event) {
        // Hide the current image
        $("#overlay img").hide();
        // Overlay image location
        var $currentImgSrc = $("#overlay img").attr("src");
        // Image with matching location of the overlay image
        var $currentImg = $('#image-gallery img[src="' + $currentImgSrc + '"]');
        // Finds the next image
        var $nextImg = $($currentImg.closest(".image").prev().find("img"));
        // Fade in the next image
        $("#overlay img").attr("src", $nextImg.attr("src")).fadeIn(800);
        // Prevents overlay from being hidden
        event.stopPropagation();
      });

      // When the exit button is clicked
      $exitButton.click(function () {
        // Fade out the overlay
        $("#overlay").fadeOut("slow");
      });
    },
    // story page timeline
    timeLineStory: function () {
      (function () {

        'use strict';

        // define variables
        var items = document.querySelectorAll(".timeline li");

        // check if an element is in viewport
        // http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
        function isElementInViewport(el) {
          var rect = el.getBoundingClientRect();
          return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
          );
        }

        function callbackFunc() {
          for (var i = 0; i < items.length; i++) {
            if (isElementInViewport(items[i])) {
              items[i].classList.add("in-view");
            }
          }
        }

        // listen for events
        window.addEventListener("load", callbackFunc);
        window.addEventListener("resize", callbackFunc);
        window.addEventListener("scroll", callbackFunc);

      })();



    },
    vedioActivation: function (e) {
      $('#play-video, .play-video').on('click', function (e) {
        e.preventDefault();
        $('.video-overlay').addClass('open');
        $(".video-overlay").append('<iframe width="560" height="315" src="https://www.youtube.com/embed/Giek094C_l4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>');
      });

      $('.video-overlay, .video-overlay-close').on('click', function (e) {
        e.preventDefault();
        close_video();
      });

      $(document).keyup(function (e) {
        if (e.keyCode === 27) {
          close_video();
        }
      });

      function close_video() {
        $('.video-overlay.open').removeClass('open').find('iframe').remove();
      };
    },
    odoMeter: function () {
      $(document).ready(function () {
        function isInViewport(element) {
          const rect = element.getBoundingClientRect();
          return (
            rect.top >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
          );
        }

        function triggerOdometer(element) {
          const $element = $(element);
          if (!$element.hasClass('odometer-triggered')) {
            const countNumber = $element.attr('data-count');
            $element.html(countNumber);
            $element.addClass('odometer-triggered'); // Add a class to prevent re-triggering
          }
        }

        function handleOdometer() {
          $('.odometer').each(function () {
            if (isInViewport(this)) {
              triggerOdometer(this);
            }
          });
        }

        // Check on page load
        handleOdometer();

        // Check on scroll
        $(window).on('scroll', function () {
          handleOdometer();
        });
      });


    },

    // search popup
    searchOption: function () {
      $(document).on('click', '.search', function () {
        $(".search-input-area").addClass("show");
        $("#anywhere-home").addClass("bgshow");
      });
      $(document).on('click', '#close', function () {
        $(".search-input-area").removeClass("show");
        $("#anywhere-home").removeClass("bgshow");
      });
      $(document).on('click', '#anywhere-home', function () {
        $(".search-input-area").removeClass("show");
        $("#anywhere-home").removeClass("bgshow");
      });

    },
    metismenu: function () {
      $('#mobile-menu-active').metisMenu();
    },

    swiperActive: function () {
      $(document).ready(function () {

        var sliderThumbnail = new Swiper(".slider-thumbnail", {
          spaceBetween: 30,
          slidesPerView: 3,
          freeMode: true,
          watchSlidesVisibility: true,
          watchSlidesProgress: true,
          breakpoints: {
            991: {
              spaceBetween: 30,
            },
            320: {
              spaceBetween: 15,
            }
          },
        });

        var swiper = new Swiper(".swiper-container-h12", {
          thumbs: {
            swiper: sliderThumbnail,
          },
        });

      });



      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-pd-slider", {
          speed: 1600,
          slidesPerView: 1,
          spaceBetween: 0,
          loop: true,
          autoplay: false,
          keyboard: {
            enabled: true,
            onlyInViewport: true
          },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          autoplay: {
            delay: 2500,
            disableOnInteraction: false,
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".swiper-vision", {
          direction: "horizontal",
          effect: "slide",
          speed: 1600,
          slidesPerView: 1,
          spaceBetween: 0,
          slidesPerGroup: 1,
          centeredSlides: true,
          loop: true,
          autoplay: false,
          keyboard: {
            enabled: true,
            onlyInViewport: true
          },
          loopFillGroupWithBlank: true,
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
            autoplay: false,
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-banner-one", {
          spaceBetween: 0,
          slidesPerView: 1,
          loop: true,
          speed: 1000,
          effect: "fade",
          pagination: {
            el: ".swiper-paginations",
            clickable: true,
            renderBullet: function (index, className) {
              return '<span class="' + className + '">' + "0" + (index + 1) + "</span>";
            },
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-banner-five", {
          spaceBetween: 0,
          slidesPerView: 1,
          loop: true,
          speed: 1000,
          // autoplay: {
          //   delay: 3000,
          //   disableOnInteraction: false,
          // },
          // effect: "fade",
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-estimonias-inner", {
          spaceBetween: 0,
          slidesPerView: 1,
          loop: true,
          speed: 1000,
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-service-one", {
          spaceBetween: 30,
          slidesPerView: 3,
          loop: true,
          speed: 1000,
          // autoplay: {
          //   delay: 3000,
          //   disableOnInteraction: false,
          // },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
          },
          breakpoints: {
            1500: {
              slidesPerView: 3,
            },
            1199: {
              slidesPerView: 3,
            },
            991: {
              slidesPerView: 2,
            },
            767: {
              slidesPerView: 2,
            },
            575: {
              slidesPerView: 1,
            },
            0: {
              slidesPerView: 1,
            }
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-case-5", {
          spaceBetween: 24,
          slidesPerView: 4,
          loop: true,
          speed: 1000,
          centeredSlides: true,
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          breakpoints: {
            1500: {
              slidesPerView: 2.6,
            },
            1199: {
              slidesPerView: 1.2,
            },
            991: {
              slidesPerView: 1.1,
            },
            767: {
              slidesPerView: 1.1,
            },
            575: {
              slidesPerView: 1,
            },
            0: {
              slidesPerView: 1,
            }
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-team-5", {
          spaceBetween: 24,
          slidesPerView: 4,
          loop: true,
          speed: 1000,
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          breakpoints: {
            1500: {
              slidesPerView: 4,
            },
            1199: {
              slidesPerView: 3,
            },
            991: {
              slidesPerView: 3,
            },
            767: {
              slidesPerView: 2,
            },
            575: {
              slidesPerView: 1,
            },
            0: {
              slidesPerView: 1,
            }
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-testimonails-5", {
          spaceBetween: 24,
          slidesPerView: 2,
          loop: true,
          speed: 1000,
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          breakpoints: {
            1500: {
              slidesPerView: 2,
            },
            1199: {
              slidesPerView: 2,
            },
            991: {
              slidesPerView: 2,
            },
            767: {
              slidesPerView: 1,
            },
            575: {
              slidesPerView: 1,
            },
            0: {
              slidesPerView: 1,
            }
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-portfolio-two", {
          spaceBetween: 24,
          slidesPerView: 2,
          loop: true,
          speed: 1000,
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          breakpoints: {
            1500: {
              slidesPerView: 2,
            },
            1199: {
              slidesPerView: 2,
            },
            991: {
              slidesPerView: 1,
            },
            767: {
              slidesPerView: 1,
            },
            575: {
              slidesPerView: 1,
            },
            0: {
              slidesPerView: 1,
            }
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-project-1", {
          spaceBetween: 40,
          slidesPerView: 2.5,
          loop: true,
          speed: 1000,
          centeredSlides: true,
          autoplay: {
            delay: 2500,
            disableOnInteraction: false,
          },
          breakpoints: {
            1500: {
              slidesPerView: 2.5,
            },
            1199: {
              slidesPerView: 3,
            },
            991: {
              slidesPerView: 1.5,
            },
            767: {
              slidesPerView: 1.5,
            },
            575: {
              slidesPerView: 1,
            },
            0: {
              slidesPerView: 1,
            }
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-brand-1", {
          spaceBetween: 103,
          slidesPerView: 6,
          loop: true,
          speed: 1000,
          autoplay: {
            delay: 2500,
            disableOnInteraction: false,
          },
          breakpoints: {
            1500: {
              slidesPerView: 6,
            },
            1199: {
              slidesPerView: 6,
            },
            991: {
              slidesPerView: 5,
            },
            767: {
              slidesPerView: 4,
            },
            575: {
              slidesPerView: 3,
            },
            0: {
              slidesPerView: 2,
            }
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-testimonails", {
          spaceBetween: 24,
          slidesPerView: 2,
          loop: true,
          speed: 1000,
          // autoplay: {
          //   delay: 2500,
          //   disableOnInteraction: false,
          // },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          breakpoints: {
            1500: {
              slidesPerView: 2,
            },
            1199: {
              slidesPerView: 2,
            },
            991: {
              slidesPerView: 2,
            },
            767: {
              slidesPerView: 1,
            },
            575: {
              slidesPerView: 1,
            },
            0: {
              slidesPerView: 1,
            }
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-banner2", {
          spaceBetween: 0,
          slidesPerView: 1,
          loop: true,
          speed: 1500,
          effect: "fade",
          autoplay: {
            delay: 4500,
            disableOnInteraction: false,
          },
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-banner-factrory", {
          spaceBetween: 0,
          slidesPerView: 1,
          loop: true,
          speed: 1500,
          effect: "fade",
          autoplay: {
            delay: 4500,
            disableOnInteraction: false,
          },
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
          },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-testimonails-3", {
          spaceBetween: 0,
          slidesPerView: 1,
          loop: true,
          speed: 1000,
          autoplay: {
            delay: 3000,
            disableOnInteraction: false,
          },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-testimonails-4", {
          spaceBetween: 24,
          slidesPerView: 2,
          loop: true,
          speed: 1000,
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
          },
          breakpoints: {
            1500: {
              slidesPerView: 2,
            },
            1199: {
              slidesPerView: 2,
            },
            991: {
              slidesPerView: 1,
            },
            767: {
              slidesPerView: 1,
            },
            575: {
              slidesPerView: 1,
            },
            0: {
              slidesPerView: 1,
            }
          },
        });
      });
      $(document).ready(function () {
        var swiper_1 = new Swiper(".mySwiper-banner-four", {
          spaceBetween: 0,
          slidesPerView: 1,
          loop: true,
          speed: 500,
          // autoplay: {
          //   delay: 4000,
          //   disableOnInteraction: false,
          // },
          // effect: "fade",
          pagination: {
            el: '.swiper-pagination', // For bullet pagination
            type: 'bullets',
            clickable: true, // Allows clicking on the bullets
          },

        });
        var swiper_thumb = new Swiper(".mySwiper-thumbnail", {
          spaceBetween: 20,
          slidesPerView: 2,
          direction: "vertical",
          loop: true,
          speed: 500,
          // autoplay: {
          //   delay: 4000,
          //   disableOnInteraction: false,
          // },
          // effect: "fade",
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
        });

        swiper_1.controller.control = swiper_thumb;
        swiper_thumb.controller.control = swiper_1;

      });
      $(document).ready(function () {
        var swiper = new Swiper(".mySwiper-team-4", {
          spaceBetween: 24,
          slidesPerView: 4,
          loop: true,
          speed: 1000,
          autoplay: {
            delay: 3000,
            disableOnInteraction: false,
          },
          // mousewheel: true,
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          pagination: {
            el: ".swiper-pagination",
            type: "progressbar",
          },
          breakpoints: {
            1500: {
              slidesPerView: 4,
            },
            1199: {
              slidesPerView: 3,
            },
            991: {
              slidesPerView: 3,
            },
            767: {
              slidesPerView: 2,
            },
            575: {
              slidesPerView: 1,
            },
            0: {
              slidesPerView: 1,
            }
          },
        });
      });
      $(document).ready(function () {
        var swiper_1 = new Swiper(".mySwiper-banner-three", {
          spaceBetween: 0,
          slidesPerView: 1,
          loop: true,
          speed: 500,
          autoplay: {
            delay: 4000,
            disableOnInteraction: false,
          },
          effect: "fade",
          pagination: {
            el: '.swiper-pagination', // For bullet pagination
            type: 'bullets',
            clickable: true, // Allows clicking on the bullets
          },

        });
        swiper_1.on('slideChange', function () {
          console.log('slider moved');
          var activeslide = swiper_1.realIndex;
          var totalslide = swiper_1.slides.length;
          console.log(activeslide);
          $(".activeslide").html('0' + (activeslide + 1));
          $(".totalslide").html('0' + (totalslide));
        });
      });

    },

    wowActive: function () {
      new WOW().init();
    },

    stickyHeader: function (e) {
      $(window).scroll(function () {
        if ($(this).scrollTop() > 50) {
          $('.header--sticky').addClass('sticky')
        } else {
          $('.header--sticky').removeClass('sticky')
        }
      })
    },

    backToTopInit: function () {
      $(document).ready(function () {
        "use strict";

        var progressPath = document.querySelector('.progress-wrap path');
        var pathLength = progressPath.getTotalLength();
        progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
        progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
        progressPath.style.strokeDashoffset = pathLength;
        progressPath.getBoundingClientRect();
        progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';
        var updateProgress = function () {
          var scroll = $(window).scrollTop();
          var height = $(document).height() - $(window).height();
          var progress = pathLength - (scroll * pathLength / height);
          progressPath.style.strokeDashoffset = progress;
        }
        updateProgress();
        $(window).scroll(updateProgress);
        var offset = 50;
        var duration = 550;
        jQuery(window).on('scroll', function () {
          if (jQuery(this).scrollTop() > offset) {
            jQuery('.progress-wrap').addClass('active-progress');
          } else {
            jQuery('.progress-wrap').removeClass('active-progress');
          }
        });
        jQuery('.progress-wrap').on('click', function (event) {
          event.preventDefault();
          jQuery('html, body').animate({ scrollTop: 0 }, duration);
          return false;
        })


      });
    },

    sideMenu: function () {

      // collups menu side right
      $(document).on('click', '.menu-btn', function () {
        $("#side-bar").addClass("show");
        $("#anywhere-home").addClass("bgshow");
      });
      $(document).on('click', '.close-icon-menu', function () {
        $("#side-bar").removeClass("show");
        $("#anywhere-home").removeClass("bgshow");
      });
      $(document).on('click', '#anywhere-home', function () {
        $("#side-bar").removeClass("show");
        $("#anywhere-home").removeClass("bgshow");
      });
      $(document).on('click', '.onepage .mainmenu li a', function () {
        $("#side-bar").removeClass("show");
        $("#anywhere-home").removeClass("bgshow");
      });
    },

    menuCurrentLink: function () {
      var currentPage = location.pathname.split("/"),
        current = currentPage[currentPage.length - 1];
      $('.parent-nav li > a').each(function () {
        var $this = $(this);
        if ($this.attr('href') === current) {
          $this.addClass('active');
          $this.parents('.has-dropdown').addClass('menu-item-open')
        }
      });
    },

    imageSwipe: function () {
      $(document).ready(function () {
        "use strict";


        var e = {
          init: function () {
            e.aosFunc();


          },

          isVariableDefined: function (el) {
            return typeof !!el && (el) != 'undefined' && el != null;
          },

          select: function (selectors) {
            return document.querySelector(selectors);
          },

          // START: 08 AOS Animation
          aosFunc: function () {
            var aos = e.select('.aos');
            if (e.isVariableDefined(aos)) {
              AOS.init({
                duration: 500,
                easing: 'ease-out-quart',
                once: true
              });
            }
          },
          // END: AOS Animation


        };
        e.init();
      });

    },

    niceSelect: function () {
      $(document).ready(function () {
        $('select').niceSelect();
      });
    },

    portfolioHOver: function () {
      document.addEventListener('DOMContentLoaded', () => {
        // Get all project elements
        const projectElements = document.querySelectorAll('.single-project-3');
        // Get all image elements
        const imageElements = document.querySelectorAll('.thumbnail-portfolio-3 img');

        projectElements.forEach((project, index) => {
          project.addEventListener('mouseenter', () => {
            // Remove active class from all images
            imageElements.forEach(image => image.classList.remove('active'));
            // Add active class to the corresponding image
            if (imageElements[index]) {
              imageElements[index].classList.add('active');
            }
          });
        });
      });

    },

    cartBarshow: function () {
      // Cart Bar show & hide
      $(document).on('click', '.cart-icon', function () {
        $(".cart-bar").addClass("show");
        $("#anywhere-home").addClass("bgshow");
      });
      $(document).on('click', '.close-cart', function () {
        $(".cart-bar").removeClass("show");
        $("#anywhere-home").removeClass("bgshow");
      });
      $(document).on('click', '#anywhere-home', function () {
        $(".cart-bar").removeClass("show");
        $("#anywhere-home").removeClass("bgshow");
      });



      $(function () {
        $(".button").on("click", function () {
          var $button = $(this);
          var $parent = $button.parent();
          var oldValue = $parent.find('.input').val();

          if ($button.text() == "+") {
            var newVal = parseFloat(oldValue) + 1;
          } else {
            // Don't allow decrementing below zero
            if (oldValue > 1) {
              var newVal = parseFloat(oldValue) - 1;
            } else {
              newVal = 1;
            }
          }
          $parent.find('a.add-to-cart').attr('data-quantity', newVal);
          $parent.find('.input').val(newVal);
        });
      });

    },

    galleryPopUpmag: function () {
      $('.gallery-image').magnificPopup({
        type: 'image',
        gallery: {
          enabled: true
        }
      });
    },

    rtlToggle: function () {

      $(document).ready(function () {
        // Retrieve the saved direction from localStorage
        const savedDir = localStorage.getItem("pageDirection") || "ltr"; // Default to "ltr"
        $("body").attr("dir", savedDir);

        // Update button visibility based on saved direction
        if (savedDir === "rtl") {
          $(".rtl").removeClass("show");
          $(".ltr").addClass("show");
        } else {
          $(".rtl").addClass("show");
          $(".ltr").removeClass("show");
        }

        // Toggle direction and save state on button click
        $(".rtl-ltr-switcher-btn").on("click", function () {
          const currentDir = $("body").attr("dir");
          const newDir = currentDir === "rtl" ? "ltr" : "rtl";

          // Update body direction
          $("body").attr("dir", newDir);

          // Toggle button visibility
          $(".rtl").toggleClass("show");
          $(".ltr").toggleClass("show");

          // Save the new direction in localStorage
          localStorage.setItem("pageDirection", newDir);
        });
      });

    },

  }

  rtsJs.m();
})(jQuery, window)







