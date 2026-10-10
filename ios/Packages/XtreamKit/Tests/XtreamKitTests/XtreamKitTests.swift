import XCTest
@testable import XtreamKit

final class DecodingTests: XCTestCase {
    private func decode<T: Decodable>(_ type: T.Type, _ json: String) throws -> T {
        try JSONDecoder().decode(T.self, from: Data(json.utf8))
    }

    func testAuthResponseWithMixedTypes() throws {
        let json = """
        {"user_info":{"username":"demo","password":"x","message":"Bienvenue","auth":1,"status":"Active",
         "exp_date":"1767225600","is_trial":"0","active_cons":"0","created_at":"1700000000",
         "max_connections":"2","allowed_output_formats":["m3u8","ts"]},
         "server_info":{"url":"exemple.tv","port":"8080","https_port":"8443","server_protocol":"http",
         "timezone":"Europe/Paris","timestamp_now":1728500000}}
        """
        let auth = try decode(AuthResponse.self, json)
        XCTAssertTrue(auth.userInfo.isAuthenticated)
        XCTAssertTrue(auth.userInfo.isActive)
        XCTAssertEqual(auth.userInfo.maxConnections, 2)
        XCTAssertEqual(auth.userInfo.expirationDate, Date(timeIntervalSince1970: 1767225600))
        XCTAssertEqual(auth.userInfo.allowedOutputFormats, ["m3u8", "ts"])
        XCTAssertEqual(auth.serverInfo?.timezone, "Europe/Paris")
    }

    func testAuthWithNullExpiry() throws {
        let auth = try decode(AuthResponse.self, #"{"user_info":{"username":"a","auth":0,"exp_date":null}}"#)
        XCTAssertFalse(auth.userInfo.isAuthenticated)
        XCTAssertNil(auth.userInfo.expirationDate)
        XCTAssertNil(auth.serverInfo)
    }

    func testLiveStreamsLossy() throws {
        let json = """
        [{"num":1,"name":"TF1 HD ","stream_type":"live","stream_id":101,"stream_icon":"http://logo.tv/tf1 hd.png",
          "epg_channel_id":"TF1.fr","added":"1600000000","category_id":"5","tv_archive":1,"tv_archive_duration":"7"},
         {"num":"2","name":"France 2","stream_id":"102","stream_icon":"","epg_channel_id":null,"category_id":5,
          "tv_archive":"0","tv_archive_duration":0},
         {"name":"Cassé"}]
        """
        let streams = try XtreamClient.decodeList(LiveStream.self, from: Data(json.utf8))
        XCTAssertEqual(streams.count, 2)
        XCTAssertEqual(streams[0].name, "TF1 HD")
        XCTAssertTrue(streams[0].hasArchive)
        XCTAssertEqual(streams[0].archiveDays, 7)
        XCTAssertNotNil(streams[0].icon)
        XCTAssertEqual(streams[1].id, 102)
        XCTAssertEqual(streams[1].categoryId, "5")
        XCTAssertNil(streams[1].icon)
        XCTAssertNil(streams[1].epgChannelId)
        XCTAssertFalse(streams[1].hasArchive)
    }

    func testEmptyListVariants() throws {
        for body in ["[]", "{}", "null", ""] {
            XCTAssertEqual(try XtreamClient.decodeList(XtreamCategory.self, from: Data(body.utf8)).count, 0, body)
        }
        XCTAssertThrowsError(try XtreamClient.decodeList(XtreamCategory.self, from: Data("<html>".utf8)))
    }

    func testVODInfoWithEmptyInfoArray() throws {
        let info = try decode(VODInfo.self, #"{"info":[],"movie_data":{"stream_id":55,"name":"Film","container_extension":"mkv"}}"#)
        XCTAssertEqual(info.streamId, 55)
        XCTAssertEqual(info.containerExtension, "mkv")
        XCTAssertNil(info.plot)
    }

    func testVODInfoFull() throws {
        let json = """
        {"info":{"movie_image":"https://img/p.jpg","plot":"Résumé","cast":"A, B","director":"D","genre":"Drame",
         "releasedate":"2020-01-01","duration_secs":5400,"rating":"7.5","backdrop_path":["https://img/b.jpg"],
         "youtube_trailer":"abc123"},
         "movie_data":{"stream_id":"9","name":"Mon film","container_extension":"mp4"}}
        """
        let info = try decode(VODInfo.self, json)
        XCTAssertEqual(info.durationSeconds, 5400)
        XCTAssertEqual(info.rating, 7.5)
        XCTAssertEqual(info.backdrops.count, 1)
        XCTAssertEqual(info.trailerURL?.absoluteString, "https://www.youtube.com/watch?v=abc123")
    }

    func testSeriesInfoDictionaryEpisodes() throws {
        let json = """
        {"seasons":[{"season_number":1,"name":"Saison 1","cover":"https://img/s1.jpg"},{"name":"bad"}],
         "info":{"plot":"Une série","backdrop_path":"https://img/bd.jpg"},
         "episodes":{"1":[{"id":"1002","episode_num":2,"title":"E2","container_extension":"mkv","season":1,
                          "info":{"duration_secs":"2400","plot":"p"}},
                         {"id":"1001","episode_num":"1","title":"E1","container_extension":"mp4","season":"1","info":[]}],
                    "2":[{"id":2001,"episode_num":1,"title":"S2E1","season":2}]}}
        """
        let info = try decode(SeriesInfo.self, json)
        XCTAssertEqual(info.seasons.count, 1)
        XCTAssertEqual(info.sortedSeasonNumbers, [1, 2])
        XCTAssertEqual(info.episodesBySeason[1]?.map(\.id), ["1001", "1002"])
        XCTAssertEqual(info.episodesBySeason[1]?.last?.durationSeconds, 2400)
        XCTAssertEqual(info.episodesBySeason[2]?.first?.id, "2001")
        XCTAssertEqual(info.seasonName(2), "Saison 2")
        XCTAssertEqual(info.backdrops.count, 1)
    }

    func testSeriesInfoArrayEpisodes() throws {
        let json = #"{"seasons":[],"info":{},"episodes":[[{"id":"7","episode_num":1,"title":"A","season":3}]]}"#
        let info = try decode(SeriesInfo.self, json)
        XCTAssertEqual(info.episodesBySeason[3]?.count, 1)
    }

    func testShortEPGBase64() throws {
        let title = Data("Journal de 20h".utf8).base64EncodedString()
        let desc = Data("L'actualité".utf8).base64EncodedString()
        let json = """
        {"epg_listings":[
          {"id":"2","title":"\(title)","description":"\(desc)","start_timestamp":"1728504000","stop_timestamp":"1728505800","has_archive":1},
          {"id":"1","title":"\(title)","start_timestamp":1728500000,"stop_timestamp":1728504000},
          {"id":"x","title":"sans horaire"}]}
        """
        let epg = try decode(EPGResponse.self, json).listings
        XCTAssertEqual(epg.map(\.id), ["1", "2"])
        XCTAssertEqual(epg[1].title, "Journal de 20h")
        XCTAssertEqual(epg[1].description, "L'actualité")
        XCTAssertTrue(epg[1].hasArchive)
        XCTAssertEqual(epg[1].progress(at: Date(timeIntervalSince1970: 1728504900)), 0.5, accuracy: 0.001)
    }
}

final class ClientTests: XCTestCase {
    func testServerNormalization() throws {
        let cases = [
            "exemple.tv:8080": "http://exemple.tv:8080",
            "http://exemple.tv:8080/": "http://exemple.tv:8080",
            "https://exemple.tv/player_api.php?username=a&password=b": "https://exemple.tv",
            " http://exemple.tv/sub/get.php ": "http://exemple.tv/sub",
        ]
        for (input, expected) in cases {
            let c = try XtreamCredentials(server: input, username: "u", password: "p")
            XCTAssertEqual(c.serverURL.absoluteString, expected, input)
        }
        XCTAssertThrowsError(try XtreamCredentials(server: "", username: "u", password: "p"))
        XCTAssertThrowsError(try XtreamCredentials(server: "exemple.tv", username: "", password: "p"))
    }

    func testURLs() throws {
        let client = XtreamClient(credentials: try XtreamCredentials(server: "exemple.tv:8080", username: "jean", password: "p@ss"))
        let stream = LiveStream(id: 101, name: "TF1", hasArchive: true, archiveDays: 7)
        XCTAssertEqual(client.liveURL(stream).absoluteString, "http://exemple.tv:8080/live/jean/p@ss/101.m3u8")
        XCTAssertEqual(client.liveURL(stream, format: .ts).absoluteString, "http://exemple.tv:8080/live/jean/p@ss/101.ts")
        XCTAssertEqual(client.movieURL(id: 9, containerExtension: "mkv").absoluteString, "http://exemple.tv:8080/movie/jean/p@ss/9.mkv")

        let api = client.apiURL(action: "get_short_epg", params: ["stream_id": "101", "limit": "4"])
        XCTAssertEqual(api.absoluteString,
                       "http://exemple.tv:8080/player_api.php?username=jean&password=p@ss&action=get_short_epg&limit=4&stream_id=101")

        // 2024-10-09 20:00 UTC = 22:00 à Paris (heure d'été), durée 45 min.
        let program = EPGProgram(id: "1", title: "T", start: Date(timeIntervalSince1970: 1728504000),
                                 end: Date(timeIntervalSince1970: 1728506700))
        let url = client.catchupURL(stream: stream, program: program, timeZone: TimeZone(identifier: "Europe/Paris"))
        XCTAssertEqual(url.absoluteString, "http://exemple.tv:8080/timeshift/jean/p@ss/45/2024-10-09:22-00/101.m3u8")
    }
}
